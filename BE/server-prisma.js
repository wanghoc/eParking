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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`eParking backend (Prisma) listening on http://localhost:${PORT}`);
});
