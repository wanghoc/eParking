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

  // Create sample cameras
  await prisma.camera.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Camera A1',
      location: 'Bãi xe A - Cổng vào',
      type: 'Vào',
      status: 'Hoạt động',
      ip_address: '192.168.1.101',
      port: 8080,
      protocol: 'HTTP',
      username: 'admin',
      password: 'admin123',
      camera_brand: 'Hikvision',
      resolution: '1080p',
      fps: 30,
    },
  });

  await prisma.camera.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Camera A2',
      location: 'Bãi xe A - Cổng ra',
      type: 'Ra',
      status: 'Hoạt động',
      ip_address: '192.168.1.102',
      port: 8080,
      protocol: 'HTTP',
      username: 'admin',
      password: 'admin123',
      camera_brand: 'Hikvision',
      resolution: '1080p',
      fps: 30,
    },
  });

  // Create sample parking lots
  await prisma.parkingLot.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Bãi xe A',
      capacity: 50,
      occupied: 25,
      fee_per_turn: 2000,
      status: 'Hoạt động',
    },
  });

  await prisma.parkingLot.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Bãi xe B',
      capacity: 30,
      occupied: 15,
      fee_per_turn: 2000,
      status: 'Hoạt động',
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
