const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Insert system settings
  const systemSettings = await prisma.systemSetting.createMany({
    data: [
      {
        setting_key: 'fee_per_turn',
        setting_value: '2000',
        setting_type: 'number',
        description: 'Phí gửi xe mỗi lượt (VND)'
      },
      {
        setting_key: 'low_balance_threshold',
        setting_value: '5000',
        setting_type: 'number',
        description: 'Ngưỡng cảnh báo số dư thấp (VND)'
      },
      {
        setting_key: 'min_topup_amount',
        setting_value: '10000',
        setting_type: 'number',
        description: 'Số tiền nạp tối thiểu (VND)'
      },
      {
        setting_key: 'max_topup_amount',
        setting_value: '1000000',
        setting_type: 'number',
        description: 'Số tiền nạp tối đa (VND)'
      },
      {
        setting_key: 'max_vehicles_per_user',
        setting_value: '3',
        setting_type: 'number',
        description: 'Số lượng xe tối đa mỗi người dùng'
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${systemSettings.count} system settings`);

  // Insert payment methods
  const paymentMethods = await prisma.paymentMethod.createMany({
    data: [
      { name: 'Momo', type: 'Ví điện tử', icon: 'MOMO', status: 'active' },
      { name: 'VNPay', type: 'Ví điện tử', icon: 'VNPAY', status: 'active' },
      { name: 'ZaloPay', type: 'Ví điện tử', icon: 'ZALOPAY', status: 'inactive' }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${paymentMethods.count} payment methods`);

  // Insert parking lots
  const parkingLots = await prisma.parkingLot.createMany({
    data: [
      { name: 'Bãi xe A', capacity: 50, fee_per_turn: 2000, status: 'Hoạt động' },
      { name: 'Bãi xe B', capacity: 40, fee_per_turn: 2000, status: 'Hoạt động' }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${parkingLots.count} parking lots`);

  // Insert cameras
  const cameras = await prisma.camera.createMany({
    data: [
      {
        name: 'Camera A1',
        location: 'Bãi xe A - Cổng vào',
        type: 'Vao',
        status: 'Hoạt động',
        ip_address: '192.168.1.101',
        resolution: '1080p',
        fps: 30,
        connection: 'Online',
        battery: '100%'
      },
      {
        name: 'Camera A2',
        location: 'Bãi xe A - Cổng ra',
        type: 'Ra',
        status: 'Hoạt động',
        ip_address: '192.168.1.102',
        resolution: '1080p',
        fps: 30,
        connection: 'Online',
        battery: '95%'
      },
      {
        name: 'Camera B1',
        location: 'Bãi xe B - Cổng vào',
        type: 'Vao',
        status: 'Hoạt động',
        ip_address: '192.168.1.103',
        resolution: '1080p',
        fps: 30,
        connection: 'Online',
        battery: '88%'
      },
      {
        name: 'Camera B2',
        location: 'Bãi xe B - Cổng ra',
        type: 'Ra',
        status: 'Lỗi',
        ip_address: '192.168.1.104',
        resolution: '1080p',
        fps: 0,
        connection: 'Offline',
        battery: '45%'
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${cameras.count} cameras`);

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Insert demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Admin',
      mssv: 'ADM001',
      email: 'admin@dlu.edu.vn',
      password: hashedPassword,
      phone: '0123456000',
      role: 'admin',
      status: 'active'
    }
  });

  const student1 = await prisma.user.upsert({
    where: { email: '2212375@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Triệu Quang Học',
      mssv: '2212375',
      email: '2212375@dlu.edu.vn',
      password: hashedPassword,
      phone: '0123456789',
      role: 'student',
      status: 'active'
    }
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Student Demo',
      mssv: '2212343',
      email: 'student@dlu.edu.vn',
      password: hashedPassword,
      phone: '0987654321',
      role: 'student',
      status: 'active'
    }
  });

  const student3 = await prisma.user.upsert({
    where: { email: '2212456@dlu.edu.vn' },
    update: {},
    create: {
      username: 'Lê Thành Thái',
      mssv: '2212456',
      email: '2212456@dlu.edu.vn',
      password: hashedPassword,
      phone: '0369852147',
      role: 'student',
      status: 'inactive'
    }
  });

  console.log('✅ Created demo users');

  // Create wallets for users
  await prisma.wallet.createMany({
    data: [
      { user_id: admin.id, balance: 100000.00 },
      { user_id: student1.id, balance: 36000000.00 },
      { user_id: student2.id, balance: 25000.00 },
      { user_id: student3.id, balance: 5000.00 }
    ],
    skipDuplicates: true
  });

  console.log('✅ Created wallets');

//   // Create demo vehicles
//   await prisma.vehicle.createMany({
//     data: [
//       {
//         user_id: student1.id,
//         license_plate: '49P1-12345',
//         brand: 'Honda',
//         model: 'Wave Alpha',
//         vehicle_type: 'Xe_may'
//       },
//       {
//         user_id: student1.id,
//         license_plate: '49P2-67890',
//         brand: 'Yamaha',
//         model: 'Exciter 150',
//         vehicle_type: 'Xe_may'
//       },
//       {
//         user_id: student2.id,
//         license_plate: '49P3-54321',
//         brand: 'Honda',
//         model: 'Winner X',
//         vehicle_type: 'Xe_may'
//       }
//     ],
//     skipDuplicates: true
//   });

//   console.log('✅ Created demo vehicles');

//   console.log('🎉 Seed completed successfully!');
// }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
