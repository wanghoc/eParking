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

  // Create student users
  const studentPassword = await bcrypt.hash('123456', 10);
  
  const student1 = await prisma.user.upsert({
    where: { email: '2212375@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Nguyễn Văn An',
      mssv: '2212375',
      email: '2212375@dlu.edu.vn',
      phone: '0901234567',
      password: studentPassword,
      role: 'student',
      status: 'active',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: '2212343@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Trần Thị Bình',
      mssv: '2212343',
      email: '2212343@dlu.edu.vn',
      phone: '0902345678',
      password: studentPassword,
      role: 'student',
      status: 'active',
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: '2212456@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Lê Văn Cường',
      mssv: '2212456',
      email: '2212456@dlu.edu.vn',
      phone: '0903456789',
      password: studentPassword,
      role: 'student',
      status: 'active',
    },
  });

  // Create wallets for students
  await prisma.wallet.upsert({
    where: { user_id: student1.id },
    update: {},
    create: {
      user_id: student1.id,
      balance: 150000, // 150K VND
    },
  });

  await prisma.wallet.upsert({
    where: { user_id: student2.id },
    update: {},
    create: {
      user_id: student2.id,
      balance: 85000, // 85K VND
    },
  });

  await prisma.wallet.upsert({
    where: { user_id: student3.id },
    update: {},
    create: {
      user_id: student3.id,
      balance: 45000, // 45K VND
    },
  });

  // Create sample vehicles for students
  await prisma.vehicle.upsert({
    where: { license_plate: '49G1-11111' },
    update: {},
    create: {
      user_id: student1.id,
      license_plate: '49G1-11111',
      brand: 'Honda',
      model: 'Winner X',
      vehicle_type: 'Xe_may',
    },
  });

  await prisma.vehicle.upsert({
    where: { license_plate: '49H1-22222' },
    update: {},
    create: {
      user_id: student1.id,
      license_plate: '49H1-22222',
      brand: 'Yamaha',
      model: 'Exciter',
      vehicle_type: 'Xe_may',
    },
  });

  await prisma.vehicle.upsert({
    where: { license_plate: '49K1-33333' },
    update: {},
    create: {
      user_id: student2.id,
      license_plate: '49K1-33333',
      brand: 'Honda',
      model: 'Future',
      vehicle_type: 'Xe_may',
    },
  });

  await prisma.vehicle.upsert({
    where: { license_plate: '49L1-44444' },
    update: {},
    create: {
      user_id: student3.id,
      license_plate: '49L1-44444',
      brand: 'SYM',
      model: 'Attila ES',
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
  // CHỈ TẠO 2 CAMERAS BÃI A (theo yêu cầu người dùng)
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

  // NOTE: Cameras cho bãi B và C đã bị XÓA
  // Admin có thể tự tạo cameras mới qua UI nếu cần

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

  // Create sample transactions for students
  await prisma.transaction.createMany({
    data: [
      {
        user_id: student1.id,
        type: 'TOPUP',
        method: 'MOMO',
        amount: 100000,
        status: 'Thành công',
        description: 'Nạp tiền qua Momo',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        user_id: student1.id,
        type: 'TOPUP',
        method: 'VNPay',
        amount: 50000,
        status: 'Thành công',
        description: 'Nạp tiền qua VNPay',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        user_id: student2.id,
        type: 'TOPUP',
        method: 'MOMO',
        amount: 85000,
        status: 'Thành công',
        description: 'Nạp tiền qua Momo',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        user_id: student3.id,
        type: 'TOPUP',
        method: 'VNPay',
        amount: 45000,
        status: 'Thành công',
        description: 'Nạp tiền qua VNPay',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ],
    skipDuplicates: true,
  });

  // Create sample parking sessions
  const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  await prisma.parkingSession.create({
    data: {
      vehicle_id: (await prisma.vehicle.findUnique({ where: { license_plate: '49G1-11111' } })).id,
      lot_id: parkingLotA.id,
      entry_time: yesterday,
      exit_time: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      fee: 2000,
      status: 'OUT',
      recognition_method: 'Tự động',
      payment_status: 'Da_thanh_toan',
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
