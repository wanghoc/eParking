const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const prisma = require('./lib/prisma');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_FEE_PER_TURN = 2000; // VND

// Helper function to ensure wallet exists
async function ensureWallet(userId) {
  let wallet = await prisma.wallet.findUnique({
    where: { user_id: userId }
  });
  
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        user_id: userId,
        balance: 0.00
      }
    });
  }
  
  return wallet;
}

// Helper function to get fee per turn
async function getFeePerTurn(lotId) {
  if (!lotId) return DEFAULT_FEE_PER_TURN;
  
  const lot = await prisma.parkingLot.findUnique({
    where: { id: lotId }
  });
  
  return lot?.fee_per_turn ? Number(lot.fee_per_turn) : DEFAULT_FEE_PER_TURN;
}

// Helper function to sanitize user data
function sanitizeUserRow(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// AUTH ENDPOINTS
app.post('/api/register', async (req, res) => {
  const { username, mssv, email, password, phone } = req.body;
  
  if (!username || !mssv || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mssv: mssv }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Email or MSSV already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        mssv,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'student'
      }
    });

    // Create wallet for user
    await ensureWallet(user.id);
    
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ 
      message: 'Login successful', 
      user: sanitizeUserRow(user) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        mssv: true,
        email: true,
        phone: true,
        role: true,
        created_at: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// VEHICLES ENDPOINTS
app.get('/api/users/:userId/vehicles', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' }
    });
    
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const { user_id, license_plate, brand, model, vehicle_type } = req.body;
  
  if (!user_id || !license_plate) {
    return res.status(400).json({ message: 'user_id and license_plate required' });
  }
  
  try {
    // Check for existing license plate
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { license_plate }
    });
    
    if (existingVehicle) {
      return res.status(409).json({ message: 'License plate already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        user_id: parseInt(user_id),
        license_plate,
        brand: brand || null,
        model: model || null,
        vehicle_type: vehicle_type || 'Xe_may'
      }
    });
    
    res.status(201).json({ message: 'Vehicle registered', vehicleId: vehicle.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering vehicle' });
  }
});

app.delete('/api/vehicles/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  
  try {
    // Check for open parking sessions
    const openSession = await prisma.parkingSession.findFirst({
      where: {
        vehicle_id: parseInt(vehicleId),
        exit_time: null
      }
    });
    
    if (openSession) {
      return res.status(400).json({ message: 'Cannot delete vehicle with open parking session' });
    }
    
    await prisma.vehicle.delete({
      where: { id: parseInt(vehicleId) }
    });
    
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
});

// WALLET ENDPOINTS
app.get('/api/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const wallet = await ensureWallet(parseInt(userId));
    res.json({ 
      user_id: parseInt(userId), 
      balance: Number(wallet.balance) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching wallet' });
  }
});

app.post('/api/wallet/topup', async (req, res) => {
  const { user_id, amount, method } = req.body;
  
  if (!user_id || !amount) {
    return res.status(400).json({ message: 'user_id and amount required' });
  }
  
  try {
    // Update wallet balance and create transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists
      await ensureWallet(parseInt(user_id));
      
      // Update wallet balance
      const wallet = await tx.wallet.update({
        where: { user_id: parseInt(user_id) },
        data: {
          balance: {
            increment: parseFloat(amount)
          }
        }
      });
      
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          user_id: parseInt(user_id),
          type: 'TOPUP',
          method: method || 'MOMO',
          amount: parseFloat(amount),
          status: 'Thành công',
          description: 'Nạp tiền vào ví'
        }
      });
      
      return { wallet, transaction };
    });
    
    res.status(201).json({ 
      message: 'Topup successful', 
      transactionId: result.transaction.id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error on topup' });
  }
});

// TRANSACTIONS ENDPOINTS
app.get('/api/transactions', async (req, res) => {
  const { user_id } = req.query;
  
  try {
    const whereClause = user_id ? { user_id: parseInt(user_id) } : {};
    
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: 100
    });
    
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// PARKING LOTS ENDPOINTS
app.get('/api/parking-lots', async (req, res) => {
  try {
    const parkingLots = await prisma.parkingLot.findMany({
      orderBy: { id: 'asc' }
    });
    
    res.json(parkingLots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching parking lots' });
  }
});

// PAYMENT METHODS ENDPOINTS
app.get('/api/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { id: 'asc' }
    });
    
    res.json(paymentMethods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching payment methods' });
  }
});

// CAMERAS ENDPOINTS
app.get('/api/cameras', async (req, res) => {
  try {
    const cameras = await prisma.camera.findMany({
      orderBy: { id: 'asc' }
    });
    
    res.json(cameras);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cameras' });
  }
});

// DASHBOARD STATS
app.get('/api/dashboard/stats', async (req, res) => {
  const { userId } = req.query;
  
  try {
    const [vehiclesCount, currentParking, monthlyParking, wallet] = await Promise.all([
      prisma.vehicle.count({ where: { user_id: parseInt(userId) } }),
      prisma.parkingSession.count({
        where: {
          vehicle: { user_id: parseInt(userId) },
          exit_time: null
        }
      }),
      prisma.parkingSession.count({
        where: {
          vehicle: { user_id: parseInt(userId) },
          entry_time: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      }),
      ensureWallet(parseInt(userId))
    ]);

    res.json({
      vehiclesCount,
      currentParking,
      monthlyParking,
      balance: Number(wallet.balance)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// ADMIN: Totals stats (users, vehicles, parking)
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const [totalUsers, totalVehicles, currentParking] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.parkingSession.count({ where: { exit_time: null } })
    ]);
    res.json({ totalUsers, totalVehicles, currentParking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

// ADMIN: Vehicles list with owner and status
app.get('/api/admin/vehicles', async (_req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        user: { select: { id: true, username: true, mssv: true } },
        parking_sessions: {
          where: { exit_time: null },
          select: { id: true },
          take: 1
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = vehicles.map(v => ({
      id: v.id,
      license_plate: v.license_plate,
      brand: v.brand,
      model: v.model,
      created_at: v.created_at,
      owner: { id: v.user?.id || null, name: v.user?.username || '', mssv: v.user?.mssv || '' },
      status: (v.parking_sessions && v.parking_sessions.length > 0) ? 'Đang gửi' : 'Không gửi'
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin vehicles' });
  }
});

// ADMIN: Users list with vehicles count and wallet balance
app.get('/api/admin/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        mssv: true,
        phone: true,
        vehicles: { select: { id: true } },
        wallet: { select: { balance: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = users.map(u => ({
      id: u.id,
      name: u.username,
      studentId: u.mssv,
      phone: u.phone || '',
      vehicles: u.vehicles.length,
      balance: u.wallet ? Number(u.wallet.balance) : 0
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin users' });
  }
});

// ADMIN: Vehicles list with owner info (mssv, username)
app.get('/api/admin/vehicles', async (_req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        user: {
          select: { id: true, username: true, mssv: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = vehicles.map(v => ({
      id: v.id,
      license_plate: v.license_plate,
      brand: v.brand,
      model: v.model,
      vehicle_type: v.vehicle_type,
      created_at: v.created_at,
      owner: {
        id: v.user?.id || null,
        name: v.user?.username || '',
        mssv: v.user?.mssv || ''
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin vehicles' });
  }
});

// PARKING SESSIONS & HISTORY
app.get('/api/parking-history/:vehicle_id', async (req, res) => {
  const { vehicle_id } = req.params;
  
  try {
    const sessions = await prisma.parkingSession.findMany({
      where: { vehicle_id: parseInt(vehicle_id) },
      include: {
        vehicle: {
          select: {
            license_plate: true,
            brand: true,
            model: true,
            vehicle_type: true
          }
        }
      },
      orderBy: { entry_time: 'desc' },
      take: 50
    });
    
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching parking history' });
  }
});

app.post('/api/parking-sessions/check-in', async (req, res) => {
  const { license_plate, lot_id, recognition_method } = req.body;
  
  if (!license_plate) {
    return res.status(400).json({ message: 'license_plate required' });
  }
  
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { license_plate }
    });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Check for open session
    const openSession = await prisma.parkingSession.findFirst({
      where: {
        vehicle_id: vehicle.id,
        exit_time: null
      }
    });
    
    if (openSession) {
      return res.status(400).json({ message: 'Vehicle already checked in' });
    }
    
    await prisma.parkingSession.create({
      data: {
        vehicle_id: vehicle.id,
        lot_id: lot_id || null,
        status: 'IN',
        recognition_method: recognition_method || 'Tự động',
        payment_status: 'Chua_thanh_toan'
      }
    });
    
    await prisma.systemLog.create({
      data: {
        action: 'Xe vào bãi',
        type: 'Recognition'
      }
    });
    
    res.status(201).json({ message: 'Checked in' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error on check-in' });
  }
});

app.post('/api/parking-sessions/check-out', async (req, res) => {
  const { license_plate } = req.body;
  
  if (!license_plate) {
    return res.status(400).json({ message: 'license_plate required' });
  }
  
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { license_plate },
      include: { user: true }
    });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const session = await prisma.parkingSession.findFirst({
      where: {
        vehicle_id: vehicle.id,
        exit_time: null
      },
      orderBy: { entry_time: 'desc' }
    });
    
    if (!session) {
      return res.status(400).json({ message: 'No open session' });
    }
    
    const feePerTurn = await getFeePerTurn(session.lot_id);
    const fee = feePerTurn;
    
    const wallet = await ensureWallet(vehicle.user_id);
    if (Number(wallet.balance) < fee) {
      return res.status(400).json({ 
        message: 'Insufficient balance', 
        required: fee, 
        balance: Number(wallet.balance) 
      });
    }
    
    await prisma.$transaction([
      prisma.wallet.update({
        where: { user_id: vehicle.user_id },
        data: {
          balance: {
            decrement: fee
          }
        }
      }),
      prisma.transaction.create({
        data: {
          user_id: vehicle.user_id,
          type: 'FEE',
          method: 'AUTO',
          amount: -fee,
          status: 'Thành công',
          description: `Trừ phí gửi xe - ${license_plate}`
        }
      }),
      prisma.parkingSession.update({
        where: { id: session.id },
        data: {
          exit_time: new Date(),
          fee: fee,
          status: 'OUT',
          payment_status: 'Da_thanh_toan'
        }
      }),
      prisma.systemLog.create({
        data: {
          action: 'Xe ra bãi',
          type: 'Payment'
        }
      })
    ]);
    
    res.json({ message: 'Checked out', fee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error on check-out' });
  }
});

// PARKING LOTS OVERVIEW
app.get('/api/parking-lots/overview', async (_req, res) => {
  try {
    const lots = await prisma.parkingLot.findMany({
      orderBy: { id: 'asc' }
    });
    
    const lotsWithOccupancy = await Promise.all(
      lots.map(async (lot) => {
        const occupied = await prisma.parkingSession.count({
          where: {
            lot_id: lot.id,
            exit_time: null
          }
        });
        
        return {
          id: lot.id,
          name: lot.name,
          capacity: lot.capacity,
          fee_per_turn: Number(lot.fee_per_turn),
          status: lot.status,
          occupied
        };
      })
    );
    
    res.json(lotsWithOccupancy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching parking lots overview' });
  }
});

// RECENT ACTIVITIES
app.get('/api/activities/recent', async (_req, res) => {
  try {
    const sessions = await prisma.parkingSession.findMany({
      include: {
        vehicle: { select: { license_plate: true } },
        parking_lot: { select: { name: true } }
      },
      orderBy: { entry_time: 'desc' },
      take: 30
    });
    
    const activities = [];
    
    for (const session of sessions) {
      // Entry activity
      activities.push({
        id: `${session.id}-entry`,
        type: 'Xe vào bãi',
        plateNumber: session.vehicle.license_plate,
        time: session.entry_time.toISOString(),
        location: session.parking_lot?.name || '-',
        recognitionMethod: session.recognition_method
      });
      
      // Exit activity (if exists)
      if (session.exit_time) {
        activities.push({
          id: `${session.id}-exit`,
          type: 'Xe ra bãi',
          plateNumber: session.vehicle.license_plate,
          time: session.exit_time.toISOString(),
          location: session.parking_lot?.name || '-',
          recognitionMethod: session.recognition_method
        });
      }
    }
    
    // Sort by time descending
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    res.json(activities.slice(0, 30));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
});

// ALERTS
app.get('/api/alerts', async (_req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        camera: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 100
    });
    
    const formatted = alerts.map(a => ({
      id: a.id,
      type: a.type,
      message: a.message,
      priority: a.priority,
      created_at: a.created_at,
      camera: a.camera?.name || null
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// SYSTEM LOGS
app.get('/api/logs', async (_req, res) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 200
    });
    
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching system logs' });
  }
});

// USERS LIST (admin)
app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        mssv: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        vehicles: { select: { id: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    
    const formatted = users.map(u => ({
      id: u.id,
      name: u.username,
      mssv: u.mssv,
      phone: u.phone,
      email: u.email,
      role: u.role,
      status: u.status,
      vehicles: u.vehicles.length
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// USER PROFILE UPDATE
app.put('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username, phone } = req.body;
  
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { username, phone },
      select: {
        id: true,
        username: true,
        mssv: true,
        email: true,
        phone: true,
        role: true,
        created_at: true
      }
    });
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// CHANGE PASSWORD
app.put('/api/users/:userId/password', async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedNewPassword }
    });
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ADMIN UPDATE USER BALANCE
app.put('/api/admin/users/:userId/balance', async (req, res) => {
  const { userId } = req.params;
  const { newBalance, adminPassword } = req.body;
  
  if (!newBalance || !adminPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }
  
  if (isNaN(Number(newBalance)) || Number(newBalance) < 0) {
    return res.status(400).json({ message: 'Số dư không hợp lệ' });
  }
  
  try {
    // Verify admin password (simplified)
    if (adminPassword !== 'admin123') {
      return res.status(401).json({ message: 'Mật khẩu admin không đúng' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { username: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const wallet = await ensureWallet(parseInt(userId));
    const oldBalance = Number(wallet.balance);
    const balanceChange = Number(newBalance) - oldBalance;
    
    await prisma.$transaction([
      prisma.wallet.update({
        where: { user_id: parseInt(userId) },
        data: { balance: Number(newBalance) }
      }),
      ...(balanceChange !== 0 ? [
        prisma.transaction.create({
          data: {
            user_id: parseInt(userId),
            type: balanceChange > 0 ? 'TOPUP' : 'FEE',
            method: 'ADMIN',
            amount: balanceChange,
            status: 'Thành công',
            description: balanceChange > 0 
              ? `Admin cộng tiền vào tài khoản (+${balanceChange.toLocaleString()}₫)`
              : `Admin trừ tiền từ tài khoản (${balanceChange.toLocaleString()}₫)`
          }
        }),
        prisma.systemLog.create({
          data: {
            action: `Admin điều chỉnh số dư: ${user.username}`,
            user_id: parseInt(userId),
            type: 'Admin'
          }
        })
      ] : [])
    ]);
    
    res.json({
      message: 'Cập nhật số dư thành công',
      oldBalance,
      newBalance: Number(newBalance),
      change: balanceChange
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi cập nhật số dư' });
  }
});

// VEHICLE EDIT
app.put('/api/vehicles/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  const { brand, model, vehicle_type } = req.body;
  
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(vehicleId) },
      data: { brand, model, vehicle_type }
    });
    
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating vehicle' });
  }
});

// PARKING LOT CREATE
app.post('/api/parking-lots', async (req, res) => {
  const { name, capacity, status } = req.body;
  
  if (!name || !capacity) {
    return res.status(400).json({ message: 'Tên bãi xe và sức chứa là bắt buộc' });
  }
  
  try {
    // Get fee from system settings
    const feeSettings = await prisma.systemSetting.findUnique({
      where: { setting_key: 'fee_per_turn' }
    });
    
    const feePerTurn = feeSettings ? parseFloat(feeSettings.setting_value) : 2000;
    
    const lot = await prisma.parkingLot.create({
      data: {
        name,
        capacity: parseInt(capacity),
        fee_per_turn: feePerTurn,
        status: status || 'Hoạt động'
      }
    });
    
    res.status(201).json({ 
      message: 'Tạo bãi xe thành công', 
      parkingLot: lot 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tạo bãi xe' });
  }
});

// PARKING LOT UPDATE
app.put('/api/parking-lots/:lotId', async (req, res) => {
  const { lotId } = req.params;
  const { name, capacity, status } = req.body;
  
  try {
    // Get fee from system settings
    const feeSettings = await prisma.systemSetting.findUnique({
      where: { setting_key: 'fee_per_turn' }
    });
    
    const feePerTurn = feeSettings ? parseFloat(feeSettings.setting_value) : 2000;
    
    const lot = await prisma.parkingLot.update({
      where: { id: parseInt(lotId) },
      data: { 
        name, 
        capacity: parseInt(capacity), 
        fee_per_turn: feePerTurn,
        status 
      }
    });
    
    res.json(lot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật bãi xe' });
  }
});

// PARKING LOT DELETE
app.delete('/api/parking-lots/:lotId', async (req, res) => {
  const { lotId } = req.params;
  
  try {
    // Check if there are active parking sessions
    const activeSessions = await prisma.parkingSession.count({
      where: {
        lot_id: parseInt(lotId),
        exit_time: null
      }
    });
    
    if (activeSessions > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa bãi xe đang có xe gửi' 
      });
    }
    
    await prisma.parkingLot.delete({
      where: { id: parseInt(lotId) }
    });
    
    res.json({ message: 'Xóa bãi xe thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa bãi xe' });
  }
});

// CAMERA UPDATE
app.put('/api/cameras/:cameraId', async (req, res) => {
  const { cameraId } = req.params;
  const { name, location, type, status } = req.body;
  
  try {
    const camera = await prisma.camera.update({
      where: { id: parseInt(cameraId) },
      data: { name, location, type, status }
    });
    
    res.json(camera);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating camera' });
  }
});

// SYSTEM SETTINGS
app.get('/api/system-settings', async (_req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { setting_key: 'asc' }
    });
    
    const formatted = {};
    settings.forEach(row => {
      let value = row.setting_value;
      if (row.setting_type === 'number') {
        value = Number(value);
      } else if (row.setting_type === 'boolean') {
        value = value === 'true';
      }
      formatted[row.setting_key] = value;
    });
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching system settings' });
  }
});

app.put('/api/system-settings', async (req, res) => {
  const { settings } = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Invalid settings data' });
  }
  
  try {
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.update({
          where: { setting_key: key },
          data: { setting_value: String(value) }
        })
      )
    );
    
    await prisma.systemLog.create({
      data: {
        action: 'Cập nhật cấu hình hệ thống',
        type: 'Admin'
      }
    });
    
    res.json({ message: 'Cập nhật cấu hình thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating system settings' });
  }
});

// ADMIN DASHBOARD: Active Parking Sessions
app.get('/api/admin/parking-sessions/active', async (_req, res) => {
  try {
    const sessions = await prisma.parkingSession.findMany({
      where: { exit_time: null },
      include: {
        vehicle: {
          select: {
            license_plate: true,
            user_id: true,
            user: {
              select: {
                wallet: { select: { balance: true } }
              }
            }
          }
        }
      },
      orderBy: { entry_time: 'desc' },
      take: 50
    });
    
    const formatted = sessions.map(s => ({
      id: s.id,
      license_plate: s.vehicle.license_plate,
      entry_time: s.entry_time,
      exit_time: s.exit_time,
      fee: Number(s.fee),
      payment_status: s.payment_status,
      user_id: s.vehicle.user_id,
      balance: s.vehicle.user?.wallet ? Number(s.vehicle.user.wallet.balance) : 0
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching active parking sessions' });
  }
});

// ADMIN DASHBOARD: Confirm Cash Payment
app.post('/api/admin/parking-sessions/:sessionId/confirm-cash', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    await prisma.$transaction([
      prisma.parkingSession.update({
        where: { id: parseInt(sessionId) },
        data: { payment_status: 'Da_thanh_toan' }
      }),
      prisma.systemLog.create({
        data: {
          action: `Admin xác nhận thu tiền mặt cho phiên ${sessionId}`,
          type: 'Admin'
        }
      })
    ]);
    
    res.json({ message: 'Đã xác nhận thu tiền mặt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error confirming cash payment' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`eParking backend (Prisma) listening on http://localhost:${PORT}`);
});
