#!/usr/bin/env node
// Quản lý máy trạm Edge. Chạy trên server (vd: docker compose exec backend node scripts/edge-device.js list).
//   create --code GATE-A --name "Cổng A" [--lane IN|OUT|BOTH] [--lot 1]
//   rotate --code GATE-A
//   revoke --code GATE-A
//   list
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { hashApiKey } = require('../api/edge_service');

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, '')] = rest[i + 1];
  return { command, opts };
}

function newKey() {
  return `edk_${crypto.randomBytes(24).toString('base64url')}`;
}

function printKey(device, key) {
  console.log(`\nDevice ${device.code} (${device.name}) lane=${device.lane} lot=${device.lot_id ?? '-'}`);
  console.log(`API key (chỉ hiển thị 1 lần, dán vào edge/config.yaml -> cloud.device_key):\n\n  ${key}\n`);
}

async function main() {
  const { command, opts } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'create': {
      if (!opts.code || !opts.name) throw new Error('create requires --code and --name');
      const lane = (opts.lane || 'BOTH').toUpperCase();
      if (!['IN', 'OUT', 'BOTH'].includes(lane)) throw new Error('--lane must be IN, OUT or BOTH');
      const key = newKey();
      const device = await prisma.edgeDevice.create({
        data: {
          code: opts.code,
          name: opts.name,
          lane,
          lot_id: opts.lot ? parseInt(opts.lot, 10) : null,
          api_key_hash: hashApiKey(key),
        },
      });
      printKey(device, key);
      break;
    }
    case 'rotate': {
      const key = newKey();
      const device = await prisma.edgeDevice.update({
        where: { code: opts.code },
        data: { api_key_hash: hashApiKey(key), status: 'active' },
      });
      printKey(device, key);
      break;
    }
    case 'revoke': {
      const device = await prisma.edgeDevice.update({ where: { code: opts.code }, data: { status: 'revoked' } });
      console.log(`Revoked ${device.code}`);
      break;
    }
    case 'list': {
      const devices = await prisma.edgeDevice.findMany({ orderBy: { code: 'asc' } });
      console.table(devices.map((d) => ({
        code: d.code, name: d.name, lane: d.lane, lot: d.lot_id, status: d.status,
        last_seen: d.last_seen_at?.toISOString() ?? '-', pending: d.pending_events, version: d.app_version ?? '-',
      })));
      break;
    }
    default:
      console.log('Usage: node scripts/edge-device.js <create|rotate|revoke|list> [--code X] [--name Y] [--lane BOTH] [--lot 1]');
      process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
