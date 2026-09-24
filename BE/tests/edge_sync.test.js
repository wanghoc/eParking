// Integration test cho luồng Edge -> Cloud. Cần Postgres RIÊNG cho test (dữ liệu sẽ bị ghi):
//   DATABASE_URL=postgresql://.../eparking_test npx prisma migrate deploy && npx prisma db seed
//   DATABASE_URL=... npm run test:edge
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const prisma = require('../lib/prisma');
const { hashApiKey } = require('../api/edge_service');

const PORT = 5099;
const BASE = `http://localhost:${PORT}/api`;
const KEY = `edk_test_${crypto.randomBytes(8).toString('hex')}`;
const PLATE = `99T9-${String(Date.now()).slice(-5)}`;
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0xff, 0xd9]).toString('base64');
let server;
let userId;

const ev = (type, minutesAgo, extra = {}) => ({
  event_id: crypto.randomUUID(),
  type,
  plate: PLATE,
  event_time: new Date(Date.now() - minutesAgo * 60000).toISOString(),
  ...extra,
});

async function call(pathname, body, key = KEY) {
  const res = await fetch(BASE + pathname, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Device ${key}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const balance = async () => Number((await prisma.wallet.findUnique({ where: { user_id: userId } })).balance);
const setBalance = (b) => prisma.wallet.update({ where: { user_id: userId }, data: { balance: b } });

before(async () => {
  await prisma.edgeDevice.create({
    data: { code: `TEST-${PLATE}`, name: 'Test gate', lane: 'BOTH', api_key_hash: hashApiKey(KEY) },
  });
  const user = await prisma.user.create({
    data: {
      username: 'Edge Test', email: `${PLATE}@test.local`, mssv: PLATE, password: 'x',
      wallet: { create: { balance: 5000 } },
      vehicles: { create: { license_plate: PLATE } },
    },
  });
  userId = user.id;

  server = spawn(process.execPath, ['server-prisma.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), EVIDENCE_DIR: path.join(__dirname, '.evidence') },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
});

after(async () => {
  server?.kill();
  await prisma.$disconnect();
});

test('rejects missing or wrong device key', async () => {
  assert.equal((await call('/edge/heartbeat', {}, 'nope')).status, 401);
});

test('heartbeat and snapshot expose fee and the vehicle cache', async () => {
  const hb = await call('/edge/heartbeat', { pending_events: 3, app_version: 'test' });
  assert.equal(hb.status, 200);
  assert.equal(hb.body.fee_per_turn, 2000);
  const snap = await call('/edge/vehicles/snapshot');
  const v = snap.body.vehicles.find((x) => x.plate === PLATE);
  assert.equal(v.plate_key, PLATE.replace('-', ''));
  assert.equal(v.in_debt, false);
});

test('online check-in/check-out charges the wallet, idempotent on retry', async () => {
  await setBalance(5000);
  const inn = await call('/edge/events', ev('CHECK_IN', 10, { images: { frame: JPEG } }));
  assert.equal(inn.body.code, 'ACCEPTED');
  assert.equal(inn.body.action, 'SESSION_OPENED');

  const outEv = ev('CHECK_OUT', 1, { plate: PLATE.replace('-', '') });
  const out = await call('/edge/events', outEv);
  assert.equal(out.body.code, 'ACCEPTED');
  assert.equal(out.body.session_id, inn.body.session_id);
  assert.equal(out.body.balance_after, 3000);

  const again = await call('/edge/events', outEv);
  assert.equal(again.body.code, 'DUPLICATE');
  assert.equal(await balance(), 3000);

  const s = await prisma.parkingSession.findUnique({ where: { id: inn.body.session_id }, include: { transaction: true } });
  assert.match(s.entry_image_url, /^\/evidence\/\d{4}\/\d{2}\/.+_frame\.jpg$/);
  assert.equal(Number(s.transaction.amount), -2000);
  const img = await fetch(`http://localhost:${PORT}${s.entry_image_url}`);
  assert.equal(img.status, 200);
});

test('online check-out with insufficient balance is blocked and not recorded; override charges into overdraft', async () => {
  await setBalance(1000);
  await call('/edge/events', ev('CHECK_IN', 30));
  const outEv = ev('CHECK_OUT', 1);
  const blocked = await call('/edge/events', outEv);
  assert.equal(blocked.body.code, 'BLOCKED_INSUFFICIENT');
  assert.equal(blocked.body.decision, 'DENY');
  assert.equal(await prisma.edgeEvent.count({ where: { event_id: outEv.event_id } }), 0);

  const ok = await call('/edge/events', { ...outEv, override: { by: 'Bảo vệ A', reason: 'test' } });
  assert.equal(ok.body.code, 'ACCEPTED');
  assert.equal(ok.body.overdraft, true);
  assert.equal(await balance(), -1000);
  const s = await prisma.parkingSession.findUnique({ where: { id: ok.body.session_id } });
  assert.equal(s.exit_source, 'MANUAL');
  assert.equal(s.override_by, 'Bảo vệ A');
});

test('online events are blocked while balance is negative (check-in included)', async () => {
  await setBalance(-500);
  const r = await call('/edge/events', ev('CHECK_IN', 0));
  assert.equal(r.body.code, 'BLOCKED_DEBT');
  assert.equal(r.body.owner.debt, 500);
});

test('batch sync never blocks: applies in event_time order and allows negative balance', async () => {
  await setBalance(1000);
  const a = ev('CHECK_IN', 50);
  const b = ev('CHECK_OUT', 40, { fee: 2000 });
  const c = ev('CHECK_IN', 30);
  const d = ev('CHECK_OUT', 20, { fee: 2000 });
  const res = await call('/edge/sync/batch', { events: [d, b, c, a] });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.summary, { ACCEPTED: 4 });
  assert.equal(await balance(), -3000);

  const txs = await prisma.transaction.findMany({ where: { user_id: userId, type: 'FEE' }, orderBy: { id: 'desc' }, take: 2 });
  assert.ok(txs.every((t) => t.overdraft));

  const retry = await call('/edge/sync/batch', { events: [a, b, c, d] });
  assert.deepEqual(retry.body.summary, { DUPLICATE: 4 });
  assert.equal(await balance(), -3000);
});

test('sync fee is capped at the current tariff', async () => {
  await setBalance(0);
  await call('/edge/sync/batch', { events: [ev('CHECK_IN', 9), ev('CHECK_OUT', 8, { fee: 999999 })] });
  assert.equal(await balance(), -2000);
});

test('out-of-order sync from two gates: exit first creates reconciliation session, entry attaches to it', async () => {
  await setBalance(10000);
  const exit = ev('CHECK_OUT', 5, { fee: 2000 });
  const r1 = await call('/edge/sync/batch', { events: [exit] });
  const sid = r1.body.results[0].session_id;
  let s = await prisma.parkingSession.findUnique({ where: { id: sid } });
  assert.equal(s.entry_missing, true);

  const entry = ev('CHECK_IN', 60);
  const r2 = await call('/edge/sync/batch', { events: [entry] });
  assert.equal(r2.body.results[0].action, 'ATTACHED_TO_EXISTING_SESSION');
  s = await prisma.parkingSession.findUnique({ where: { id: sid } });
  assert.equal(s.entry_missing, false);
  assert.equal(s.entry_event_id, entry.event_id);
  assert.equal(await prisma.parkingSession.count({ where: { vehicle: { license_plate: PLATE }, exit_time: null } }), 0);
});

test('check-in with a stale open session auto-closes it without charging', async () => {
  await setBalance(10000);
  await call('/edge/events', ev('CHECK_IN', 120));
  const r = await call('/edge/events', ev('CHECK_IN', 1));
  assert.equal(r.body.code, 'ACCEPTED');
  assert.ok(r.body.warnings.some((w) => w.includes('tự đóng')));
  const open = await prisma.parkingSession.findMany({ where: { vehicle: { license_plate: PLATE }, exit_time: null } });
  assert.equal(open.length, 1);
  assert.equal(await balance(), 10000);
});

test('unknown plate: online DENY without ledger; sync REJECTED once and alerted', async () => {
  const online = ev('CHECK_IN', 1, { plate: '00Z0-00000' });
  const r = await call('/edge/events', online);
  assert.equal(r.body.code, 'REJECTED_UNKNOWN_VEHICLE');
  assert.equal(await prisma.edgeEvent.count({ where: { event_id: online.event_id } }), 0);

  const offline = ev('CHECK_OUT', 1, { plate: '00Z0-00000' });
  const s1 = await call('/edge/sync/batch', { events: [offline] });
  assert.equal(s1.body.results[0].code, 'REJECTED_UNKNOWN_VEHICLE');
  const s2 = await call('/edge/sync/batch', { events: [offline] });
  assert.equal(s2.body.results[0].code, 'DUPLICATE');
  assert.equal(s2.body.results[0].original_code, 'REJECTED_UNKNOWN_VEHICLE');
});

test('invalid payloads are rejected per item, not per batch', async () => {
  const res = await call('/edge/sync/batch', { events: [{ event_id: 'not-a-uuid', type: 'CHECK_IN', plate: PLATE, event_time: new Date().toISOString() }] });
  assert.equal(res.body.results[0].code, 'REJECTED_INVALID');
  assert.equal((await call('/edge/events', { ...ev('CHECK_IN', 0), type: 'FLY' })).status, 400);
});

test('concurrent duplicate submissions charge exactly once', async () => {
  await setBalance(10000);
  await call('/edge/events', ev('CHECK_IN', 30));
  const outEv = ev('CHECK_OUT', 1);
  const results = await Promise.all([1, 2, 3, 4].map(() => call('/edge/events', outEv)));
  const codes = results.map((r) => r.body.code).sort();
  assert.equal(codes.filter((c) => c === 'ACCEPTED').length, 1);
  assert.equal(await balance(), 8000);
});
