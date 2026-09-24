const crypto = require('crypto');
const express = require('express');
const prisma = require('../lib/prisma');
const { CODES, processEvent, getFeePerTurn, plateKey } = require('../lib/edge_events');

const router = express.Router();
const MAX_BATCH = 100;
const LAST_SEEN_WRITE_INTERVAL_MS = 15 * 1000;

function hashApiKey(key) {
  return crypto.createHash('sha256').update(String(key)).digest('hex');
}

function readApiKey(req) {
  const auth = req.get('authorization') || '';
  if (auth.startsWith('Device ')) return auth.slice('Device '.length).trim();
  return req.get('x-device-key') || null;
}

async function authenticateDevice(req, res, next) {
  const key = readApiKey(req);
  if (!key) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing device key' });
  try {
    const device = await prisma.edgeDevice.findUnique({ where: { api_key_hash: hashApiKey(key) } });
    if (!device || device.status !== 'active') {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or revoked device key' });
    }
    if (!device.last_seen_at || Date.now() - device.last_seen_at.getTime() > LAST_SEEN_WRITE_INTERVAL_MS) {
      await prisma.edgeDevice.update({
        where: { id: device.id },
        data: { last_seen_at: new Date(), last_ip: req.ip },
      });
    }
    req.device = device;
    next();
  } catch (err) {
    next(err);
  }
}

router.use(authenticateDevice);

// Edge gọi định kỳ (mặc định 5s) để kiểm tra kết nối + báo số sự kiện đang chờ đồng bộ.
router.post('/heartbeat', async (req, res, next) => {
  try {
    const { app_version, pending_events } = req.body || {};
    const device = await prisma.edgeDevice.update({
      where: { id: req.device.id },
      data: {
        last_seen_at: new Date(),
        last_ip: req.ip,
        app_version: app_version ? String(app_version).slice(0, 50) : undefined,
        pending_events: Number.isInteger(pending_events) && pending_events >= 0 ? pending_events : undefined,
      },
    });
    res.json({
      server_time: new Date().toISOString(),
      fee_per_turn: await getFeePerTurn(),
      device: { id: device.id, code: device.code, name: device.name, lane: device.lane, lot_id: device.lot_id },
    });
  } catch (err) {
    next(err);
  }
});

// Bộ nhớ đệm cho chế độ offline: danh sách xe đã đăng ký + trạng thái nợ. Edge chỉ dùng để CẢNH BÁO khi offline, không chặn xe.
router.get('/vehicles/snapshot', async (_req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { user: { status: 'active' } },
      select: {
        license_plate: true,
        user: { select: { id: true, username: true, mssv: true, wallet: { select: { balance: true } } } },
      },
    });
    res.json({
      generated_at: new Date().toISOString(),
      fee_per_turn: await getFeePerTurn(),
      vehicles: vehicles.map((v) => {
        const balance = v.user.wallet ? Number(v.user.wallet.balance) : 0;
        return {
          plate: v.license_plate,
          plate_key: plateKey(v.license_plate),
          user_id: v.user.id,
          owner_name: v.user.username,
          mssv: v.user.mssv,
          balance,
          in_debt: balance < 0,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

// Chế độ ONLINE: xe đang đứng ở cổng, Edge chờ quyết định OPEN/DENY.
router.post('/events', async (req, res, next) => {
  try {
    const result = await processEvent(req.device, req.body, 'ONLINE');
    res.status(result.code === CODES.REJECTED_INVALID ? 400 : 200).json(result);
  } catch (err) {
    next(err);
  }
});

// Đồng bộ hàng loạt các sự kiện đã xảy ra khi offline. Xử lý tuần tự theo event_time để giữ đúng thứ tự vào -> ra.
router.post('/sync/batch', async (req, res, next) => {
  const events = Array.isArray(req.body?.events) ? req.body.events : null;
  if (!events) return res.status(400).json({ code: CODES.REJECTED_INVALID, message: 'events[] required' });
  if (events.length > MAX_BATCH) {
    return res.status(413).json({ code: CODES.REJECTED_INVALID, message: `Max ${MAX_BATCH} events per batch` });
  }

  try {
    const ordered = [...events].sort((a, b) => new Date(a?.event_time) - new Date(b?.event_time));
    const results = [];
    for (const ev of ordered) {
      try {
        results.push(await processEvent(req.device, ev, 'SYNC'));
      } catch (err) {
        console.error(`[edge-sync] event ${ev?.event_id} failed:`, err);
        results.push({ event_id: ev?.event_id, code: CODES.ERROR, retryable: true, message: 'Internal error' });
      }
    }
    const summary = results.reduce((acc, r) => ({ ...acc, [r.code]: (acc[r.code] || 0) + 1 }), {});
    res.json({ received: events.length, summary, results });
  } catch (err) {
    next(err);
  }
});

router.use((err, _req, res, _next) => {
  console.error('[edge] error:', err);
  res.status(500).json({ code: CODES.ERROR, retryable: true, message: 'Internal error' });
});

module.exports = { router, hashApiKey };
