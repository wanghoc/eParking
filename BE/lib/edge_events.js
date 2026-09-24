const fs = require('fs');
const path = require('path');
const prisma = require('./prisma');

const DEFAULT_FEE_PER_TURN = 2000;
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || path.join(__dirname, '..', 'evidence');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1000;
const MAX_IMAGE_BYTES = 512 * 1024;

const CODES = {
  ACCEPTED: 'ACCEPTED',
  DUPLICATE: 'DUPLICATE',
  BLOCKED_DEBT: 'BLOCKED_DEBT',
  BLOCKED_INSUFFICIENT: 'BLOCKED_INSUFFICIENT',
  REJECTED_UNKNOWN_VEHICLE: 'REJECTED_UNKNOWN_VEHICLE',
  REJECTED_INVALID: 'REJECTED_INVALID',
  ERROR: 'ERROR',
};

class InvalidEventError extends Error {}

// "49G1-111.11", "49 g1 11111" -> "49G111111": so khớp biển số không phụ thuộc định dạng.
function plateKey(plate) {
  return String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function toMoney(value) {
  return value === null || value === undefined ? null : Number(value);
}

async function getFeePerTurn(db = prisma) {
  const row = await db.systemSetting.findUnique({ where: { setting_key: 'fee_per_turn' } });
  const fee = row ? parseFloat(row.setting_value) : NaN;
  return Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_FEE_PER_TURN;
}

async function findVehicleByPlate(plate, db = prisma) {
  const key = plateKey(plate);
  if (!key) return null;
  const rows = await db.$queryRaw`
    SELECT id FROM vehicles
    WHERE regexp_replace(upper(license_plate), '[^A-Z0-9]', '', 'g') = ${key}
    LIMIT 1`;
  if (rows.length === 0) return null;
  return db.vehicle.findUnique({
    where: { id: rows[0].id },
    include: { user: { include: { wallet: true } } },
  });
}

function validateEvent(raw) {
  if (!raw || typeof raw !== 'object') throw new InvalidEventError('event must be an object');
  const { event_id, type, plate, event_time } = raw;
  if (!UUID_RE.test(String(event_id || ''))) throw new InvalidEventError('event_id must be a UUID');
  if (type !== 'CHECK_IN' && type !== 'CHECK_OUT') throw new InvalidEventError('type must be CHECK_IN or CHECK_OUT');
  if (!plateKey(plate)) throw new InvalidEventError('plate is required');
  const at = new Date(event_time);
  if (Number.isNaN(at.getTime())) throw new InvalidEventError('event_time must be ISO-8601');
  if (at.getTime() - Date.now() > MAX_FUTURE_SKEW_MS) throw new InvalidEventError('event_time is in the future');

  let entryTime = null;
  if (raw.entry_time) {
    entryTime = new Date(raw.entry_time);
    if (Number.isNaN(entryTime.getTime()) || entryTime > at) entryTime = null;
  }
  let fee = null;
  if (raw.fee !== undefined && raw.fee !== null) {
    fee = Number(raw.fee);
    if (!Number.isFinite(fee) || fee < 0) throw new InvalidEventError('fee must be a non-negative number');
  }
  const override = raw.override && typeof raw.override === 'object' && raw.override.by
    ? { by: String(raw.override.by).slice(0, 100), reason: String(raw.override.reason || '').slice(0, 255) }
    : null;

  return {
    event_id: String(event_id).toLowerCase(),
    type,
    plate: String(plate).toUpperCase().trim(),
    event_time: at,
    entry_time: entryTime,
    fee,
    confidence: raw.confidence === undefined ? null : Number(raw.confidence),
    images: raw.images && typeof raw.images === 'object' ? raw.images : {},
    override,
  };
}

// Ảnh bằng chứng: JPEG base64. Tên file là event_id (UUID ngẫu nhiên) nên ghi lại khi retry là idempotent.
function saveEvidence(event, kind) {
  const b64 = event.images[kind];
  if (typeof b64 !== 'string' || b64.length === 0) return null;
  const buf = Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  const d = event.event_time;
  const rel = path.posix.join(
    String(d.getUTCFullYear()),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    `${event.event_id}_${kind}.jpg`
  );
  const abs = path.join(EVIDENCE_DIR, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buf);
  return `/evidence/${rel}`;
}

function ownerInfo(vehicle, balance) {
  return {
    user_id: vehicle.user_id,
    name: vehicle.user.username,
    mssv: vehicle.user.mssv,
    plate: vehicle.license_plate,
    balance,
    debt: balance < 0 ? -balance : 0,
  };
}

async function ledgerDuplicate(eventId) {
  const existing = await prisma.edgeEvent.findUnique({ where: { event_id: eventId } });
  if (!existing) return null;
  return {
    ...(existing.result || {}),
    event_id: eventId,
    code: CODES.DUPLICATE,
    original_code: existing.result_code,
  };
}

/**
 * Xử lý 1 sự kiện ra/vào từ Edge.
 *  - mode ONLINE: xe đang ở cổng, Cloud quyết định mở/chặn. Ví âm (hoặc không đủ tiền khi ra) => BLOCKED_*,
 *    KHÔNG ghi sổ cái để bảo vệ có thể override (gửi lại cùng event_id kèm `override`).
 *  - mode SYNC: sự kiện đã diễn ra khi offline, barrier đã mở. Luôn ghi nhận, cho phép số dư âm (thấu chi).
 */
async function processEvent(device, rawEvent, mode) {
  let event;
  try {
    event = validateEvent(rawEvent);
  } catch (err) {
    if (err instanceof InvalidEventError) {
      return { event_id: rawEvent && rawEvent.event_id, code: CODES.REJECTED_INVALID, decision: 'DENY', message: err.message };
    }
    throw err;
  }

  const dup = await ledgerDuplicate(event.event_id);
  if (dup) return dup;

  const vehicle = await findVehicleByPlate(event.plate);
  if (!vehicle) {
    const result = {
      event_id: event.event_id,
      code: CODES.REJECTED_UNKNOWN_VEHICLE,
      decision: 'DENY',
      plate: event.plate,
      message: 'Biển số chưa đăng ký trong hệ thống',
    };
    if (mode === 'SYNC') {
      // Xe lạ đã đi qua cổng lúc offline: ghi sổ cái (để không retry vô hạn) + cảnh báo cho admin đối soát.
      await prisma.$transaction([
        prisma.edgeEvent.create({
          data: {
            event_id: event.event_id, device_id: device.id, type: event.type, plate: event.plate,
            event_time: event.event_time, mode, result_code: result.code, result,
          },
        }),
        prisma.alert.create({
          data: {
            device_id: device.id,
            type: 'Xe chưa đăng ký (offline)',
            message: `${event.type === 'CHECK_IN' ? 'Vào' : 'Ra'} lúc ${event.event_time.toISOString()} - biển ${event.plate}`,
            priority: 'Cao',
          },
        }),
      ]);
    }
    return result;
  }

  const currentFee = await getFeePerTurn();
  const balanceBefore = toMoney(vehicle.user.wallet?.balance) ?? 0;
  // Offline: thu đúng mức phí Edge đã hiển thị lúc xe ra, nhưng không vượt quá biểu phí hiện hành.
  const fee = mode === 'SYNC' && event.fee !== null ? Math.min(event.fee, currentFee) : currentFee;

  if (mode === 'ONLINE' && !event.override) {
    if (balanceBefore < 0) {
      return {
        event_id: event.event_id, code: CODES.BLOCKED_DEBT, decision: 'DENY',
        owner: ownerInfo(vehicle, balanceBefore), fee,
        message: `Tài khoản đang nợ cước ${(-balanceBefore).toLocaleString('vi-VN')}₫`,
      };
    }
    if (event.type === 'CHECK_OUT' && balanceBefore < fee) {
      return {
        event_id: event.event_id, code: CODES.BLOCKED_INSUFFICIENT, decision: 'DENY',
        owner: ownerInfo(vehicle, balanceBefore), fee,
        message: `Số dư ${balanceBefore.toLocaleString('vi-VN')}₫ không đủ trả phí ${fee.toLocaleString('vi-VN')}₫`,
      };
    }
  }

  const imageUrl = saveEvidence(event, 'frame') || saveEvidence(event, 'plate');
  const source = event.override ? 'MANUAL' : mode === 'SYNC' ? 'OFFLINE_SYNC' : 'ONLINE';

  try {
    return await prisma.$transaction(async (tx) => {
      // Ghi sổ cái trước: nếu 2 request cùng event_id chạy song song, request thứ 2 dính unique violation (P2002).
      await tx.edgeEvent.create({
        data: {
          event_id: event.event_id, device_id: device.id, type: event.type, plate: event.plate,
          event_time: event.event_time, mode, result_code: 'PROCESSING',
        },
      });

      const result = event.type === 'CHECK_IN'
        ? await applyCheckIn(tx, { device, event, vehicle, source, imageUrl })
        : await applyCheckOut(tx, { device, event, vehicle, source, imageUrl, fee });

      const full = {
        event_id: event.event_id,
        code: CODES.ACCEPTED,
        decision: 'OPEN',
        owner: ownerInfo(vehicle, result.balance_after ?? balanceBefore),
        ...result,
      };
      await tx.edgeEvent.update({
        where: { event_id: event.event_id },
        data: { result_code: full.code, session_id: full.session_id, result: full },
      });
      return full;
    });
  } catch (err) {
    if (err.code === 'P2002') {
      const again = await ledgerDuplicate(event.event_id);
      if (again) return again;
    }
    throw err;
  }
}

async function applyCheckIn(tx, { device, event, vehicle, source, imageUrl }) {
  const warnings = [];

  // Sự kiện RA đã được sync trước (lệch thứ tự giữa 2 máy trạm) -> gắn giờ vào cho phiên đó thay vì mở phiên mới.
  const orphan = await tx.parkingSession.findFirst({
    where: {
      vehicle_id: vehicle.id, entry_missing: true, entry_event_id: null,
      exit_time: { gte: event.event_time },
    },
    orderBy: { exit_time: 'asc' },
  });
  if (orphan) {
    const s = await tx.parkingSession.update({
      where: { id: orphan.id },
      data: {
        entry_time: event.event_time, entry_event_id: event.event_id, entry_device_id: device.id,
        entry_image_url: imageUrl, entry_source: source, entry_missing: false,
      },
    });
    return { action: 'ATTACHED_TO_EXISTING_SESSION', session_id: s.id, warnings };
  }

  // Phiên cũ chưa đóng (mất sự kiện RA): đóng tự động, không thu phí, để admin đối soát. Không chặn xe.
  const openSessions = await tx.parkingSession.findMany({
    where: { vehicle_id: vehicle.id, exit_time: null },
    orderBy: { entry_time: 'asc' },
  });
  let closeAt = null;
  for (const open of openSessions) {
    if (open.entry_time <= event.event_time) {
      await tx.parkingSession.update({
        where: { id: open.id },
        data: {
          exit_time: event.event_time, status: 'OUT', fee: 0,
          closed_reason: 'AUTO_CLOSED_MISSING_EXIT',
        },
      });
      warnings.push(`Đã tự đóng phiên #${open.id} (thiếu sự kiện ra)`);
    } else {
      // Một lượt VÀO mới hơn đã được ghi trước lượt này -> lượt này là lượt cũ, đóng ngay tại thời điểm lượt mới.
      closeAt = closeAt || open.entry_time;
    }
  }

  const s = await tx.parkingSession.create({
    data: {
      vehicle_id: vehicle.id,
      lot_id: device.lot_id,
      entry_time: event.event_time,
      status: closeAt ? 'OUT' : 'IN',
      exit_time: closeAt,
      fee: closeAt ? 0 : undefined,
      closed_reason: closeAt ? 'AUTO_CLOSED_MISSING_EXIT' : null,
      recognition_method: event.override ? 'Thủ công' : 'Tự động',
      payment_status: 'Chua_thanh_toan',
      entry_event_id: event.event_id,
      entry_device_id: device.id,
      entry_image_url: imageUrl,
      entry_source: source,
      override_by: event.override?.by || null,
    },
  });
  if (event.override) warnings.push(`Mở cổng thủ công bởi ${event.override.by}`);

  await tx.systemLog.create({
    data: { action: `Xe vào: ${vehicle.license_plate} (${device.code}, ${source})`, user_id: vehicle.user_id, type: 'Vehicle' },
  });
  return { action: 'SESSION_OPENED', session_id: s.id, warnings };
}

async function applyCheckOut(tx, { device, event, vehicle, source, imageUrl, fee }) {
  const warnings = [];

  let session = await tx.parkingSession.findFirst({
    where: { vehicle_id: vehicle.id, exit_time: null, entry_time: { lte: event.event_time } },
    orderBy: { entry_time: 'desc' },
  });
  if (!session) {
    session = await tx.parkingSession.create({
      data: {
        vehicle_id: vehicle.id,
        lot_id: device.lot_id,
        entry_time: event.entry_time || event.event_time,
        entry_missing: true,
        entry_source: source,
        status: 'IN',
      },
    });
    warnings.push('Không tìm thấy lượt vào tương ứng, đã tạo phiên đối soát');
  }

  const wallet = await tx.wallet.upsert({
    where: { user_id: vehicle.user_id },
    create: { user_id: vehicle.user_id, balance: -fee },
    update: { balance: { decrement: fee } },
  });
  const balanceAfter = Number(wallet.balance);
  const overdraft = balanceAfter < 0;

  await tx.transaction.create({
    data: {
      user_id: vehicle.user_id,
      type: 'FEE',
      method: source === 'MANUAL' ? 'MANUAL_OVERRIDE' : source === 'OFFLINE_SYNC' ? 'OFFLINE_SYNC' : 'AUTO',
      amount: -fee,
      status: 'Thành công',
      description: `Phí gửi xe - ${vehicle.license_plate}${overdraft ? ' (nợ cước)' : ''}`,
      session_id: session.id,
      overdraft,
    },
  });

  await tx.parkingSession.update({
    where: { id: session.id },
    data: {
      exit_time: event.event_time,
      status: 'OUT',
      fee,
      payment_status: 'Da_thanh_toan',
      exit_event_id: event.event_id,
      exit_device_id: device.id,
      exit_image_url: imageUrl,
      exit_source: source,
      override_by: event.override?.by || session.override_by,
    },
  });

  await tx.systemLog.create({
    data: { action: `Xe ra: ${vehicle.license_plate} - phí ${fee}₫ (${device.code}, ${source})`, user_id: vehicle.user_id, type: 'Payment' },
  });
  if (overdraft) {
    warnings.push(`Số dư âm ${balanceAfter.toLocaleString('vi-VN')}₫`);
    await tx.alert.create({
      data: {
        device_id: device.id,
        type: 'Nợ cước',
        message: `${vehicle.license_plate} (${vehicle.user.username}) số dư ${balanceAfter.toLocaleString('vi-VN')}₫`,
        priority: 'Trung_binh',
      },
    });
  }

  return {
    action: 'SESSION_CLOSED',
    session_id: session.id,
    entry_time: session.entry_time,
    fee,
    balance_after: balanceAfter,
    overdraft,
    warnings,
  };
}

module.exports = {
  CODES,
  EVIDENCE_DIR,
  plateKey,
  getFeePerTurn,
  processEvent,
  validateEvent,
};
