const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dlu.edu.vn' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@dlu.edu.vn',
      password: adminPassword,
      role: 'admin',
      status: 'active',
    },
  });

  // Create student user
  const studentPassword = await bcrypt.hash('123456', 10);
  const student = await prisma.user.upsert({
    where: { email: 'hocquang@student.dlu.edu.vn' },
    update: {},
    create: {
      username: 'hocquang',
      email: 'hocquang@student.dlu.edu.vn',
      password: studentPassword,
      role: 'student',
      status: 'active',
    },
  });

  // Create wallets for users
  await prisma.wallet.upsert({
    where: { user_id: admin.id },
    update: {},
    create: {
      user_id: admin.id,
      balance: 1000000, // 1M VND
    },
  });

  await prisma.wallet.upsert({
    where: { user_id: student.id },
    update: {},
    create: {
      user_id: student.id,
      balance: 50000, // 50K VND
    },
  });

  // Create sample vehicles
  await prisma.vehicle.upsert({
    where: { license_plate: '49P1-12345' },
    update: {},
    create: {
      user_id: student.id,
      license_plate: '49P1-12345',
      brand: 'Honda',
      model: 'Wave RSX',
      vehicle_type: 'Xe_may',
    },
  });

  // Create sample parking lots FIRST
  const parkingLotA = await prisma.parkingLot.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Bãi xe A',
      capacity: 50,
      fee_per_turn: 0, // Deprecated, use system setting
      status: 'Hoạt động',
    },
  });

  const parkingLotB = await prisma.parkingLot.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Bãi xe B',
      capacity: 30,
      fee_per_turn: 0, // Deprecated, use system setting
      status: 'Hoạt động',
    },
  });

  const parkingLotC = await prisma.parkingLot.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Bãi xe C',
      capacity: 40,
      fee_per_turn: 0, // Deprecated, use system setting
      status: 'Hoạt động',
    },
  });

  // Create sample cameras with parking_lot_id and device_id
  // Bãi xe A - 2 cameras (use webcam)
  await prisma.camera.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Camera A - Vào',
      location: 'Bãi xe A - Cổng vào',
      parking_lot_id: parkingLotA.id,
      type: 'Vao',
      status: 'Hoạt động',
      device_id: 'webcam', // Special marker for webcam
      protocol: 'HTTP',
      camera_brand: 'Webcam',
      resolution: '1080p',
      fps: 30,
    },
  });

  await prisma.camera.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Camera A - Ra',
      location: 'Bãi xe A - Cổng ra',
      parking_lot_id: parkingLotA.id,
      type: 'Ra',
      status: 'Hoạt động',
      device_id: 'webcam', // Special marker for webcam
      protocol: 'HTTP',
      camera_brand: 'Webcam',
      resolution: '1080p',
      fps: 30,
    },
  });

  // Bãi xe B - 2 cameras (use webcam)
  await prisma.camera.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Camera B - Vào',
      location: 'Bãi xe B - Cổng vào',
      parking_lot_id: parkingLotB.id,
      type: 'Vao',
      status: 'Hoạt động',
      device_id: 'webcam', // Special marker for webcam
      protocol: 'HTTP',
      camera_brand: 'Webcam',
      resolution: '1080p',
      fps: 30,
    },
  });

  await prisma.camera.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Camera B - Ra',
      location: 'Bãi xe B - Cổng ra',
      parking_lot_id: parkingLotB.id,
      type: 'Ra',
      status: 'Hoạt động',
      device_id: 'webcam', // Special marker for webcam
      protocol: 'HTTP',
      camera_brand: 'Webcam',
      resolution: '1080p',
      fps: 30,
    },
  });

  // Bãi xe C - 2 cameras (use webcam)
  await prisma.camera.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: 'Camera C - Vào',
      location: 'Bãi xe C - Cổng vào',
      parking_lot_id: parkingLotC.id,
      type: 'Vao',
      status: 'Hoạt động',
      device_id: 'webcam', // Special marker for webcam
      protocol: 'HTTP',
      camera_brand: 'Webcam',
      resolution: '1080p',
      fps: 30,
    },
  });

  await prisma.camera.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      name: 'Camera C - Ra',
      location: 'Bãi xe C - Cổng ra',
      parking_lot_id: parkingLotC.id,
      type: 'Ra',
      status: 'Hoạt động',
      device_id: 'webcam', // Special marker for webcam
      protocol: 'HTTP',
      camera_brand: 'Webcam',
      resolution: '1080p',
      fps: 30,
    },
  });

  // Create system settings
  await prisma.systemSetting.upsert({
    where: { setting_key: 'fee_per_turn' },
    update: {},
    create: {
      setting_key: 'fee_per_turn',
      setting_value: '2000',
      setting_type: 'number',
      description: 'Phí gửi xe mỗi lượt (áp dụng cho tất cả bãi xe)',
    },
  });

  await prisma.systemSetting.upsert({
    where: { setting_key: 'min_topup' },
    update: {},
    create: {
      setting_key: 'min_topup',
      setting_value: '10000',
      setting_type: 'number',
      description: 'Mức nạp tối thiểu',
    },
  });

  await prisma.systemSetting.upsert({
    where: { setting_key: 'max_topup' },
    update: {},
    create: {
      setting_key: 'max_topup',
      setting_value: '1000000',
      setting_type: 'number',
      description: 'Mức nạp tối đa',
    },
  });

  await prisma.systemSetting.upsert({
    where: { setting_key: 'low_balance_threshold' },
    update: {},
    create: {
      setting_key: 'low_balance_threshold',
      setting_value: '5000',
      setting_type: 'number',
      description: 'Ngưỡng cảnh báo số dư thấp',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
