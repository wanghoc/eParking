const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const prisma = require('./lib/prisma');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
// IMPORTANT: Increase body size limit for base64 images (default is 100kb)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import ML service
const mlService = require('./api/ml_service');
app.use('/api/ml', mlService);

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

// Helper function to get fee per turn from system settings
async function getFeePerTurn() {
  try {
    const feeSettings = await prisma.systemSetting.findUnique({
      where: { setting_key: 'fee_per_turn' }
    });
    
    return feeSettings ? parseFloat(feeSettings.setting_value) : DEFAULT_FEE_PER_TURN;
  } catch (error) {
    console.error('Error getting fee per turn:', error);
    return DEFAULT_FEE_PER_TURN;
  }
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
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
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
    res.status(500).json({ message: 'Lỗi đăng ký người dùng' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    res.json({ 
      message: 'Đăng nhập thành công', 
      user: sanitizeUserRow(user) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi đăng nhập' });
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
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng' });
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
    res.status(500).json({ message: 'Lỗi lấy danh sách xe' });
  }
});

// GET parking sessions for a specific user (across all their vehicles)
app.get('/api/users/:userId/parking-sessions', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const sessions = await prisma.parkingSession.findMany({
      where: {
        vehicle: {
          user_id: parseInt(userId)
        }
      },
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
      orderBy: { entry_time: 'desc' }
    });
    
    // Format response with fee as number
    const formattedSessions = sessions.map(session => ({
      ...session,
      fee: Number(session.fee) // Convert Decimal to Number
    }));
    
    res.json(formattedSessions);
  } catch (err) {
    console.error('Error fetching user parking sessions:', err);
    res.status(500).json({ message: 'Lỗi lấy lịch sử gửi xe' });
  }
});

// Get system logs (recent activities) for user notifications
app.get('/api/users/:userId/system-logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    // Get user's vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { user_id: parseInt(userId) },
      select: { id: true }
    });
    
    const vehicleIds = vehicles.map(v => v.id);
    
    // Get recent parking sessions for user's vehicles
    const sessions = await prisma.parking_session.findMany({
      where: {
        vehicle_id: { in: vehicleIds }
      },
      orderBy: { entry_time: 'desc' },
      take: limit,
      include: {
        vehicle: {
          select: {
            license_plate: true
          }
        }
      }
    });
    
    // Convert sessions to log entries
    const logs = sessions.flatMap(session => {
      const logs = [];
      
      // Entry log
      logs.push({
        id: `entry-${session.id}`,
        type: 'info',
        title: 'Xe vào bãi thành công',
        message: `Biển số ${session.vehicle.license_plate} đã được nhận diện`,
        time: session.entry_time,
        icon: 'check-circle'
      });
      
      // Exit/Payment log if exists
      if (session.exit_time) {
        if (session.payment_status === 'Da_thanh_toan') {
          logs.push({
            id: `payment-${session.id}`,
            type: 'success',
            title: 'Thanh toán thành công',
            message: `Đã thanh toán ${Number(session.fee).toLocaleString('vi-VN')}₫ cho xe ${session.vehicle.license_plate}`,
            time: session.exit_time,
            icon: 'credit-card'
          });
        }
      }
      
      return logs;
    });
    
    // Sort by time descending and limit
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json(logs.slice(0, limit));
  } catch (err) {
    console.error('Error fetching system logs:', err);
    res.status(500).json({ message: 'Lỗi lấy thông báo hệ thống' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const { user_id, license_plate, brand, model, vehicle_type } = req.body;
  
  if (!user_id || !license_plate) {
    return res.status(400).json({ message: 'Vui lòng điền thông tin người dùng và biển số xe' });
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
    return res.status(400).json({ message: 'Vui lòng điền thông tin người dùng và số tiền' });
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

app.post('/api/cameras', async (req, res) => {
  const {
    name,
    location,
    parking_lot_id,
    type,
    ip_address,
    camera_brand,
    rtsp_url,
    http_url,
    username,
    password,
    port,
    channel,
    protocol,
    main_stream_url,
    sub_stream_url,
    audio_enabled,
    ptz_enabled,
    device_id,
    mac_address,
    serial_number,
    onvif_id,
    resolution,
    fps
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Vui lòng điền tên và loại camera' });
  }

  try {
    // Check if camera name already exists
    const existingCamera = await prisma.camera.findFirst({
      where: { name }
    });

    if (existingCamera) {
      return res.status(409).json({ message: 'Camera name already exists' });
    }

    // Normalize camera type to match Prisma enum (handle both "Vào"/"Ra" and "Vao"/"Ra")
    let normalizedType = type;
    if (type === 'Vào' || type === 'Vao') {
      normalizedType = 'Vao';
    } else if (type === 'Ra') {
      normalizedType = 'Ra';
    }

    const camera = await prisma.camera.create({
      data: {
        name,
        location: location || null,
        parking_lot_id: parking_lot_id ? parseInt(parking_lot_id) : null,
        type: normalizedType,
        ip_address: ip_address || null,
        camera_brand: camera_brand || null,
        rtsp_url: rtsp_url || null,
        http_url: http_url || null,
        username: username || null,
        password: password || null,
        port: port || (protocol === 'RTSP' ? 554 : 80),
        channel: channel || 0,
        protocol: protocol || 'RTSP',
        main_stream_url: main_stream_url || null,
        sub_stream_url: sub_stream_url || null,
        audio_enabled: audio_enabled || false,
        ptz_enabled: ptz_enabled || false,
        device_id: device_id || null,
        mac_address: mac_address || null,
        serial_number: serial_number || null,
        onvif_id: onvif_id || null,
        resolution: resolution || '1080p',
        fps: fps || 30,
        status: 'Hoạt động',
        connection: 'Online'
      }
    });

    await prisma.systemLog.create({
      data: {
        action: `Thêm camera mới: ${name}`,
        type: 'Admin'
      }
    });

    res.status(201).json({ 
      message: 'Camera created successfully', 
      cameraId: camera.id,
      camera: camera 
    });
  } catch (err) {
    console.error('Create camera error:', err);
    res.status(500).json({ 
      message: 'Error creating camera',
      error: err.message 
    });
  }
});

app.delete('/api/cameras/:cameraId', async (req, res) => {
  const { cameraId } = req.params;

  try {
    const camera = await prisma.camera.findUnique({
      where: { id: parseInt(cameraId) }
    });

    if (!camera) {
      return res.status(404).json({ message: 'Camera not found' });
    }

    await prisma.camera.delete({
      where: { id: parseInt(cameraId) }
    });

    await prisma.systemLog.create({
      data: {
        action: `Xóa camera: ${camera.name}`,
        type: 'Admin'
      }
    });

    res.json({ message: 'Camera deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting camera' });
  }
});

app.post('/api/cameras/test-connection', async (req, res) => {
  const {
    ip_address,
    port,
    username,
    password,
    protocol,
    rtsp_url,
    http_url
  } = req.body;

  try {
    // Basic validation
    if (protocol === 'RTSP' && !rtsp_url && !ip_address) {
      return res.status(400).json({ message: 'RTSP URL or IP address is required for RTSP protocol' });
    }

    if (protocol === 'HTTP' && !http_url && !ip_address) {
      return res.status(400).json({ message: 'HTTP URL or IP address is required for HTTP protocol' });
    }

    // For now, we'll simulate a connection test
    // In a real implementation, you would use libraries like node-ffmpeg or similar
    // to test actual camera connections
    
    const testResult = {
      success: true,
      message: 'Connection test successful',
      details: {
        protocol: protocol,
        ip_address: ip_address,
        port: port,
        stream_url: protocol === 'RTSP' ? rtsp_url : http_url,
        timestamp: new Date().toISOString()
      }
    };

    // Simulate some connection scenarios
    if (ip_address && ip_address.includes('192.168')) {
      testResult.success = true;
      testResult.message = 'Local network camera connection successful';
    } else if (ip_address && ip_address.includes('127.0.0.1')) {
      testResult.success = false;
      testResult.message = 'Cannot connect to localhost camera';
    }

    res.json(testResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error testing camera connection',
      error: err.message 
    });
  }
});

// Camera Stream Proxy Endpoint
app.get('/api/cameras/:id/stream', async (req, res) => {
  const { id } = req.params;
  const { protocol: queryProtocol, deviceId, rtsp } = req.query;

  try {
    const camera = await prisma.camera.findUnique({
      where: { id: parseInt(id) }
    });

    if (!camera) {
      return res.status(404).json({ message: 'Camera not found' });
    }

    // Determine which protocol to use
    const streamProtocol = queryProtocol || camera.protocol;
    let streamUrl = '';

    // Build stream URL based on protocol
    switch (streamProtocol) {
      case 'Yoosee':
        // Yoosee snapshot URL
        streamUrl = `http://${camera.ip_address}:${camera.port || 8000}/snapshot.jpg`;
        break;
        
      case 'HTTP':
        // HTTP stream/snapshot URL
        streamUrl = camera.http_url || `http://${camera.ip_address}:${camera.port || 80}/videostream.cgi`;
        break;
        
      case 'RTSP':
        // RTSP stream - use FFmpeg to convert to JPEG snapshot
        const rtspUrl = camera.rtsp_url || `rtsp://${camera.ip_address}:${camera.port || 554}/live/ch00_0`;
        
        // Build FFmpeg command with authentication if provided
        let ffmpegUrl = rtspUrl;
        if (camera.username && camera.password && !rtspUrl.includes('@')) {
          // Insert credentials into URL
          ffmpegUrl = rtspUrl.replace('rtsp://', `rtsp://${camera.username}:${camera.password}@`);
        }

        // Use FFmpeg to capture a single frame as JPEG
        const { exec } = require('child_process');
        const ffmpegCmd = `ffmpeg -rtsp_transport tcp -i "${ffmpegUrl}" -vframes 1 -f image2pipe -vcodec mjpeg -`;
        
        exec(ffmpegCmd, { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg error:', error);
            return res.status(500).json({ 
              message: 'Failed to capture RTSP stream',
              error: error.message
            });
          }

          if (stdout && stdout.length > 0) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.send(stdout);
          } else {
            res.status(500).json({ 
              message: 'FFmpeg produced no output',
              stderr: stderr.toString()
            });
          }
        });
        
        return; // Exit early, FFmpeg handles response
        
      case 'ONVIF':
        // ONVIF snapshot - usually at /onvif/snapshot
        streamUrl = `http://${camera.ip_address}:${camera.port || 80}/onvif/snapshot`;
        break;
        
      default:
        // Generic HTTP snapshot
        streamUrl = `http://${camera.ip_address}:${camera.port || 80}/snapshot.jpg`;
    }

    // Add authentication if provided
    let fetchOptions = {
      method: 'GET',
      timeout: 5000
    };

    if (camera.username && camera.password) {
      const auth = Buffer.from(`${camera.username}:${camera.password}`).toString('base64');
      fetchOptions.headers = {
        'Authorization': `Basic ${auth}`
      };
    }

    // Fetch the image from camera using axios
    const axios = require('axios');
    
    try {
      const axiosResponse = await axios.get(streamUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxRedirects: 5,
        headers: fetchOptions.headers || {},
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      if (axiosResponse.status === 200) {
        // Set headers for image
        res.setHeader('Content-Type', axiosResponse.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Send image data
        res.send(Buffer.from(axiosResponse.data));
      } else if (axiosResponse.status === 401) {
        res.status(401).json({ 
          message: 'Camera authentication failed',
          details: 'Invalid username or password'
        });
      } else {
        res.status(axiosResponse.status).json({ 
          message: 'Camera returned error',
          statusCode: axiosResponse.status,
          details: axiosResponse.statusText
        });
      }
    } catch (error) {
      console.error('Camera stream error:', error.message);
      res.status(500).json({ 
        message: 'Failed to connect to camera',
        error: error.message,
        streamUrl: streamUrl.replace(/:[^:]*@/, ':****@') // Hide password in logs
      });
    }

  } catch (err) {
    console.error('Stream endpoint error:', err);
    res.status(500).json({ 
      message: 'Error fetching camera stream',
      error: err.message 
    });
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

// ADMIN: Users list with vehicles count and wallet balance (only students)
app.get('/api/admin/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'student'  // Only get students, not admins
      },
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

// ADMIN DELETE USER
app.delete('/api/admin/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { adminPassword } = req.body;
  
  if (!adminPassword) {
    return res.status(400).json({ message: 'Mật khẩu admin là bắt buộc' });
  }
  
  try {
    // Verify admin password by checking against admin user in database
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      return res.status(500).json({ message: 'Không tìm thấy tài khoản admin' });
    }
    
    const isValidPassword = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Mật khẩu admin không đúng' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { 
        id: true,
        username: true,
        mssv: true,
        role: true,
        wallet: { select: { balance: true } }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Check if user is admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }
    
    // Check if user has zero balance
    const balance = user.wallet ? Number(user.wallet.balance) : 0;
    if (balance !== 0) {
      return res.status(400).json({ 
        message: 'Chỉ có thể xóa tài khoản khi số dư bằng 0₫',
        currentBalance: balance
      });
    }
    
    // Check for active parking sessions
    const activeSessions = await prisma.parkingSession.count({
      where: {
        vehicle: { user_id: parseInt(userId) },
        exit_time: null
      }
    });
    
    if (activeSessions > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa tài khoản đang có xe gửi trong bãi' 
      });
    }
    
    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: parseInt(userId) }
    });
    
    // Log the action
    await prisma.systemLog.create({
      data: {
        action: `Admin xóa tài khoản: ${user.username} (MSSV: ${user.mssv})`,
        type: 'Admin'
      }
    });
    
    res.json({ 
      message: 'Xóa tài khoản thành công',
      deletedUser: {
        username: user.username,
        mssv: user.mssv
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa tài khoản' });
  }
});

// This endpoint is already defined above at line 737, removing duplicate

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
    
    const fee = await getFeePerTurn();
    
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
    
    // Get system-wide fee
    const systemFee = await getFeePerTurn();
    
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
          fee_per_turn: systemFee, // Use system-wide fee instead of individual lot fee
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
  
  if (newBalance === undefined || newBalance === null || !adminPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }
  
  if (isNaN(Number(newBalance)) || Number(newBalance) < 0) {
    return res.status(400).json({ message: 'Số dư không hợp lệ' });
  }
  
  try {
    // Verify admin password by checking against admin user in database
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      return res.status(500).json({ message: 'Không tìm thấy tài khoản admin' });
    }
    
    const isValidPassword = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isValidPassword) {
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
    // Note: fee_per_turn is no longer used, all parking lots use system-wide fee
    const lot = await prisma.parkingLot.create({
      data: {
        name,
        capacity: parseInt(capacity),
        fee_per_turn: 0, // Deprecated field, kept for backward compatibility
        status: status || 'Hoạt động'
      }
    });
    
    await prisma.systemLog.create({
      data: {
        action: `Tạo bãi xe mới: ${name}`,
        type: 'Admin'
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
    // Note: fee_per_turn is no longer used, all parking lots use system-wide fee
    const lot = await prisma.parkingLot.update({
      where: { id: parseInt(lotId) },
      data: { 
        name, 
        capacity: parseInt(capacity), 
        fee_per_turn: 0, // Deprecated field, kept for backward compatibility
        status 
      }
    });
    
    await prisma.systemLog.create({
      data: {
        action: `Cập nhật bãi xe: ${name}`,
        type: 'Admin'
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
  const {
    name,
    location,
    parking_lot_id,
    type,
    status,
    ip_address,
    camera_brand,
    rtsp_url,
    http_url,
    username,
    password,
    port,
    channel,
    protocol,
    main_stream_url,
    sub_stream_url,
    audio_enabled,
    ptz_enabled,
    device_id,
    mac_address,
    serial_number,
    onvif_id,
    resolution,
    fps
  } = req.body;
  
  try {
    // Check if camera name already exists (excluding current camera)
    if (name) {
      const existingCamera = await prisma.camera.findFirst({
        where: { 
          name,
          NOT: { id: parseInt(cameraId) }
        }
      });

      if (existingCamera) {
        return res.status(409).json({ message: 'Camera name already exists' });
      }
    }

    // Normalize camera type to match Prisma enum (handle both "Vào"/"Ra" and "Vao"/"Ra")
    let normalizedType = type;
    if (type === 'Vào' || type === 'Vao') {
      normalizedType = 'Vao';
    } else if (type === 'Ra') {
      normalizedType = 'Ra';
    }

    const camera = await prisma.camera.update({
      where: { id: parseInt(cameraId) },
      data: {
        name,
        location: location || null,
        parking_lot_id: parking_lot_id ? parseInt(parking_lot_id) : null,
        type: normalizedType,
        status: status || 'Hoạt động',
        ip_address: ip_address || null,
        camera_brand: camera_brand || null,
        rtsp_url: rtsp_url || null,
        http_url: http_url || null,
        username: username || null,
        password: password || null,
        port: port || (protocol === 'RTSP' ? 554 : 80),
        channel: channel || 0,
        protocol: protocol || 'RTSP',
        main_stream_url: main_stream_url || null,
        sub_stream_url: sub_stream_url || null,
        audio_enabled: audio_enabled || false,
        ptz_enabled: ptz_enabled || false,
        device_id: device_id || null,
        mac_address: mac_address || null,
        serial_number: serial_number || null,
        onvif_id: onvif_id || null,
        resolution: resolution || '1080p',
        fps: fps || 30
      }
    });

    await prisma.systemLog.create({
      data: {
        action: `Cập nhật camera: ${name}`,
        type: 'Admin'
      }
    });
    
    res.json({ 
      message: 'Camera updated successfully',
      camera: camera 
    });
  } catch (err) {
    console.error('Update camera error:', err);
    res.status(500).json({ 
      message: 'Error updating camera',
      error: err.message 
    });
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

// GET all parking sessions history for admin (all completed sessions - checkin + checkout)
app.get('/api/admin/parking-sessions/history', async (_req, res) => {
  try {
    const sessions = await prisma.parkingSession.findMany({
      where: {
        exit_time: { not: null }, // Only completed sessions (checked out)
        // Removed payment_status filter - show all checkout sessions regardless of payment
      },
      include: {
        vehicle: {
          select: {
            license_plate: true,
            brand: true,
            model: true,
            user_id: true,
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { exit_time: 'desc' },
      take: 100 // Limit to last 100 sessions
    });
    
    // Format sessions with fee as number
    const formattedSessions = sessions.map(session => ({
      ...session,
      fee: Number(session.fee)
    }));
    
    res.json(formattedSessions);
  } catch (err) {
    console.error('Error fetching parking history:', err);
    res.status(500).json({ message: 'Error fetching parking history' });
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
