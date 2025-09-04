const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_FEE_PER_TURN = 2000; // VND

async function ensureWallet(userId) {
  const [rows] = await db.query('SELECT id, balance FROM wallet WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    await db.query('INSERT INTO wallet (user_id, balance) VALUES (?, 0.00)', [userId]);
    return { id: (await db.query('SELECT id, balance FROM wallet WHERE user_id = ?', [userId]))[0][0].id, balance: 0 };
  }
  return rows[0];
}

async function getFeePerTurn(lotId) {
  if (!lotId) return DEFAULT_FEE_PER_TURN;
  const [rows] = await db.query('SELECT fee_per_turn FROM parking_lots WHERE id = ?', [lotId]);
  if (rows.length === 0 || rows[0].fee_per_turn == null) return DEFAULT_FEE_PER_TURN;
  return Number(rows[0].fee_per_turn);
}

function sanitizeUserRow(row) {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// AUTH
app.post('/api/register', async (req, res) => {
  const { username, mssv, email, password, phone } = req.body;
  if (!username || !mssv || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const [dup] = await db.query('SELECT id FROM users WHERE email = ? OR mssv = ?', [email, mssv]);
    if (dup.length > 0) return res.status(409).json({ message: 'Email or MSSV already registered' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (username, mssv, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, mssv, email, hash, phone || null, 'student']
    );

    await ensureWallet(result.insertId);
    res.status(201).json({ message: 'User registered', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const [rows] = await db.query('SELECT id, username, mssv, email, phone, role, password, created_at FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: sanitizeUserRow(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query('SELECT id, username, mssv, email, phone, role, created_at FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// VEHICLES
app.get('/api/users/:userId/vehicles', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query('SELECT id, user_id, license_plate, brand, model, vehicle_type, created_at FROM vehicles WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const { user_id, license_plate, brand, model, vehicle_type } = req.body;
  if (!user_id || !license_plate) return res.status(400).json({ message: 'user_id and license_plate required' });
  try {
    const [dup] = await db.query('SELECT id FROM vehicles WHERE license_plate = ?', [license_plate]);
    if (dup.length > 0) return res.status(409).json({ message: 'License plate already exists' });

    const [result] = await db.query(
      'INSERT INTO vehicles (user_id, license_plate, brand, model, vehicle_type) VALUES (?, ?, ?, ?, ?)',
      [user_id, license_plate, brand || null, model || null, vehicle_type || null]
    );
    res.status(201).json({ message: 'Vehicle registered', vehicleId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering vehicle' });
  }
});

app.delete('/api/vehicles/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const [open] = await db.query('SELECT id FROM parking_sessions WHERE vehicle_id = ? AND exit_time IS NULL', [vehicleId]);
    if (open.length > 0) return res.status(400).json({ message: 'Cannot delete vehicle with open parking session' });
    await db.query('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
});

// PARKING SESSIONS & HISTORY
app.get('/api/parking-history/:vehicle_id', async (req, res) => {
  const { vehicle_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT ps.id, ps.entry_time, ps.exit_time, ps.fee, ps.status, ps.recognition_method, ps.payment_status, v.license_plate, v.brand, v.model, v.vehicle_type FROM parking_sessions ps JOIN vehicles v ON ps.vehicle_id = v.id WHERE ps.vehicle_id = ? ORDER BY ps.entry_time DESC LIMIT 50',
      [vehicle_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching history' });
  }
});

app.post('/api/parking-sessions/check-in', async (req, res) => {
  const { license_plate, lot_id, recognition_method } = req.body;
  if (!license_plate) return res.status(400).json({ message: 'license_plate required' });
  try {
    const [veh] = await db.query('SELECT id FROM vehicles WHERE license_plate = ?', [license_plate]);
    if (veh.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
    const vehicleId = veh[0].id;

    const [open] = await db.query('SELECT id FROM parking_sessions WHERE vehicle_id = ? AND exit_time IS NULL', [vehicleId]);
    if (open.length > 0) return res.status(400).json({ message: 'Vehicle already checked in' });

    await db.query(
      'INSERT INTO parking_sessions (vehicle_id, lot_id, entry_time, status, recognition_method, payment_status) VALUES (?, ?, NOW(), ?, ?, ?)',
      [vehicleId, lot_id || null, 'IN', recognition_method || 'Tự động', 'Chưa thanh toán']
    );

    await db.query('INSERT INTO system_logs (action, user_id, type) VALUES (?, NULL, ?)', ['Xe vào bãi', 'Recognition']);

    res.status(201).json({ message: 'Checked in' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error on check-in' });
  }
});

app.post('/api/parking-sessions/check-out', async (req, res) => {
  const { license_plate } = req.body;
  if (!license_plate) return res.status(400).json({ message: 'license_plate required' });
  try {
    const [veh] = await db.query('SELECT id, user_id FROM vehicles WHERE license_plate = ?', [license_plate]);
    if (veh.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
    const vehicle = veh[0];

    const [sessRows] = await db.query('SELECT id, lot_id, entry_time FROM parking_sessions WHERE vehicle_id = ? AND exit_time IS NULL ORDER BY entry_time DESC LIMIT 1', [vehicle.id]);
    if (sessRows.length === 0) return res.status(400).json({ message: 'No open session' });
    const session = sessRows[0];

    const feePerTurn = await getFeePerTurn(session.lot_id);
    const fee = feePerTurn; // simple flat fee per session

    const wallet = await ensureWallet(vehicle.user_id);
    if (Number(wallet.balance) < fee) {
      return res.status(400).json({ message: 'Insufficient balance', required: fee, balance: Number(wallet.balance) });
    }

    await db.query('UPDATE wallet SET balance = balance - ? WHERE user_id = ?', [fee, vehicle.user_id]);
    await db.query('INSERT INTO transactions (user_id, type, method, amount, status, description) VALUES (?, ?, ?, ?, ?, ?)', [vehicle.user_id, 'FEE', 'AUTO', -fee, 'Thành công', `Trừ phí gửi xe - ${license_plate}`]);

    await db.query('UPDATE parking_sessions SET exit_time = NOW(), fee = ?, status = ?, payment_status = ? WHERE id = ?', [fee, 'OUT', 'Đã thanh toán', session.id]);
    await db.query('INSERT INTO system_logs (action, user_id, type) VALUES (?, NULL, ?)', ['Xe ra bãi', 'Payment']);

    res.json({ message: 'Checked out', fee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error on check-out' });
  }
});

// WALLET & TRANSACTIONS
app.get('/api/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const w = await ensureWallet(userId);
    res.json({ user_id: Number(userId), balance: Number(w.balance) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching wallet' });
  }
});

app.post('/api/wallet/topup', async (req, res) => {
  const { user_id, amount, method } = req.body;
  if (!user_id || !amount) return res.status(400).json({ message: 'user_id and amount required' });
  try {
    await ensureWallet(user_id);
    await db.query('UPDATE wallet SET balance = balance + ? WHERE user_id = ?', [amount, user_id]);
    const [result] = await db.query('INSERT INTO transactions (user_id, type, method, amount, status, description) VALUES (?, ?, ?, ?, ?, ?)', [user_id, 'TOPUP', method || 'MOMO', amount, 'Thành công', 'Nạp tiền vào ví']);
    res.status(201).json({ message: 'Topup successful', transactionId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error on topup' });
  }
});

app.get('/api/transactions', async (req, res) => {
  const { user_id } = req.query;
  try {
    const params = [];
    let sql = 'SELECT id, user_id, type, method, amount, status, description, created_at FROM transactions';
    if (user_id) { sql += ' WHERE user_id = ?'; params.push(user_id); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

app.get('/api/payment-methods', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, type, icon, status FROM payment_methods ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching payment methods' });
  }
});

// PARKING LOTS
app.get('/api/parking-lots', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, capacity, fee_per_turn, status FROM parking_lots ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching parking lots' });
  }
});

// CAMERAS
app.get('/api/cameras', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cameras ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cameras' });
  }
});

// ALERTS
app.get('/api/alerts', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT a.id, a.type, a.message, a.priority, a.created_at, c.name as camera FROM alerts a LEFT JOIN cameras c ON a.camera_id = c.id ORDER BY a.created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// SYSTEM LOGS
app.get('/api/logs', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, action, user_id, type, created_at FROM system_logs ORDER BY created_at DESC LIMIT 200');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// USERS LIST (admin)
app.get('/api/users', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username AS name, u.mssv, u.phone, u.email, u.role, COALESCE(u.status, 'active') AS status,
             COUNT(v.id) AS vehicles
      FROM users u
      LEFT JOIN vehicles v ON v.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// PARKING LOTS OCCUPANCY
app.get('/api/parking-lots/overview', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.id, l.name, l.capacity, l.fee_per_turn, l.status,
             COALESCE(SUM(CASE WHEN ps.exit_time IS NULL THEN 1 ELSE 0 END), 0) AS occupied
      FROM parking_lots l
      LEFT JOIN parking_sessions ps ON ps.lot_id = l.id
      GROUP BY l.id
      ORDER BY l.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching overview' });
  }
});

// RECENT ACTIVITIES (management overview)
app.get('/api/activities/recent', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      (
        SELECT ps.id, 'Xe vào bãi' AS type, v.license_plate AS plateNumber, DATE_FORMAT(ps.entry_time, '%Y-%m-%d %H:%i') AS time,
               COALESCE(l.name, '-') AS location, ps.recognition_method AS recognitionMethod
        FROM parking_sessions ps
        JOIN vehicles v ON v.id = ps.vehicle_id
        LEFT JOIN parking_lots l ON l.id = ps.lot_id
      )
      UNION ALL
      (
        SELECT ps.id, 'Xe ra bãi' AS type, v.license_plate AS plateNumber, DATE_FORMAT(ps.exit_time, '%Y-%m-%d %H:%i') AS time,
               COALESCE(l.name, '-') AS location, ps.recognition_method AS recognitionMethod
        FROM parking_sessions ps
        JOIN vehicles v ON v.id = ps.vehicle_id
        LEFT JOIN parking_lots l ON l.id = ps.lot_id
        WHERE ps.exit_time IS NOT NULL
      )
      ORDER BY time DESC
      LIMIT 30
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching activities' });
  }
});

// DASHBOARD STATS API
app.get('/api/dashboard/stats', async (req, res) => {
  const { userId } = req.query;
  try {
    // Get user's vehicles count and parking stats
    const [vehicles] = await db.query('SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?', [userId]);
    const [currentParking] = await db.query('SELECT COUNT(*) as count FROM parking_sessions ps JOIN vehicles v ON ps.vehicle_id = v.id WHERE v.user_id = ? AND ps.exit_time IS NULL', [userId]);
    const [monthlyParking] = await db.query('SELECT COUNT(*) as count FROM parking_sessions ps JOIN vehicles v ON ps.vehicle_id = v.id WHERE v.user_id = ? AND ps.entry_time >= DATE_SUB(NOW(), INTERVAL 1 MONTH)', [userId]);
    const wallet = await ensureWallet(userId);

    res.json({
      vehiclesCount: vehicles[0].count,
      currentParking: currentParking[0].count,
      monthlyParking: monthlyParking[0].count,
      balance: Number(wallet.balance)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// USER PROFILE API
app.put('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username, phone } = req.body;
  try {
    await db.query('UPDATE users SET username = ?, phone = ? WHERE id = ?', [username, phone, userId]);
    const [rows] = await db.query('SELECT id, username, mssv, email, phone, role, created_at FROM users WHERE id = ?', [userId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// CHANGE PASSWORD API
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
    // Get current user
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Verify current password
    const user = users[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// VEHICLE EDIT API
app.put('/api/vehicles/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  const { brand, model, vehicle_type } = req.body;
  try {
    await db.query('UPDATE vehicles SET brand = ?, model = ?, vehicle_type = ? WHERE id = ?', [brand, model, vehicle_type, vehicleId]);
    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating vehicle' });
  }
});

// PARKING LOT UPDATE API
app.put('/api/parking-lots/:lotId', async (req, res) => {
  const { lotId } = req.params;
  const { name, capacity, fee_per_turn, status } = req.body;
  try {
    await db.query('UPDATE parking_lots SET name = ?, capacity = ?, fee_per_turn = ?, status = ? WHERE id = ?', [name, capacity, fee_per_turn, status, lotId]);
    const [rows] = await db.query('SELECT * FROM parking_lots WHERE id = ?', [lotId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating parking lot' });
  }
});

// CAMERA UPDATE API
app.put('/api/cameras/:cameraId', async (req, res) => {
  const { cameraId } = req.params;
  const { name, location, type, status } = req.body;
  try {
    await db.query('UPDATE cameras SET name = ?, location = ?, type = ?, status = ? WHERE id = ?', [name, location, type, status, cameraId]);
    const [rows] = await db.query('SELECT * FROM cameras WHERE id = ?', [cameraId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating camera' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`eParking backend listening on http://localhost:${PORT}`);
});
