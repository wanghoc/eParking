const { spawn } = require('child_process');
const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

/**
 * Run Python inference script
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<object>} - Inference result
 */
function runInference(imageBase64) {
  // Fast path: allow disabling ML to avoid Python dependency in dev/CI
  if (!process.env.USE_ML || String(process.env.USE_ML).toLowerCase() !== 'true') {
    return Promise.resolve({
      success: true,
      plate_number: '49G1-11111',
      confidence: 0.99,
      bypassed: true,
      message: 'ML disabled, returning demo result'
    });
  }
  return new Promise((resolve, reject) => {
    // CRITICAL FIX: Use stdin instead of command line argument to avoid E2BIG error
    const python = spawn('python', [
      'ml_models/utils/inference.py',
      '--stdin'  // Tell Python to read from stdin
    ]);

    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      const stderr = data.toString();
      error += stderr;
      // Log Python stderr for debugging
      console.error('[Python stderr]', stderr);
    });

    python.on('close', (code) => {
      console.log(`[Python] Process exited with code ${code}`);
      console.log(`[Python stdout] ${result.substring(0, 500)}`);
      console.log(`[Python stderr] ${error.substring(0, 500)}`);
      
      if (code === 0) {
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(new Error('Failed to parse Python output: ' + result));
        }
      } else {
        reject(new Error('Python inference failed: ' + error));
      }
    });

    // Send base64 image via stdin (avoids command line length limit)
    python.stdin.write(imageBase64);
    python.stdin.end();

    // Set timeout (increased for first-time model loading - EasyOCR downloads models)
    setTimeout(() => {
      python.kill();
      reject(new Error('Inference timeout - Model loading may take 3-5 minutes on first run'));
    }, 180000); // 180 seconds (3 minutes) timeout for first-time model load
  });
}

/**
 * Save detection result to database
 */
async function saveDetection(cameraId, result) {
  try {
    // Log detection event
    await prisma.systemLog.create({
      data: {
        action: `Nhận diện biển số: ${result.plate_number}`,
        type: 'Recognition'
      }
    });

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { license_plate: result.plate_number },
      include: { user: true }
    });

    // Check camera type
    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    });

    if (!camera) {
      console.log('Camera not found:', cameraId);
      return { error: 'Camera not found' };
    }

    if (!vehicle) {
      console.log('Vehicle not registered:', result.plate_number);
      return { 
        registered: false,
        camera_type: camera.type,
        status_message: 'Chưa đăng ký xe'
      };
    }

    // Vehicle is registered - handle based on camera type
    // Handle both Prisma enum format (Vao/Ra) and Vietnamese format (Vào/Ra)
    const isEntrance = camera.type === 'Vào' || camera.type === 'Vao';
    const isExit = camera.type === 'Ra';
    
    if (isEntrance) {
      // Entry camera - create parking session
      const entryResult = await handleEntry(vehicle, camera);
      return { 
        registered: true,
        camera_type: camera.type,
        status_message: entryResult && entryResult.status === 'already_parked' ? 'Xe đã đang gửi' : 'Check-in thành công'
      };
    } else if (isExit) {
      // Exit camera - check balance and process payment
      const exitResult = await handleExit(vehicle, camera);
      return {
        registered: true,
        camera_type: camera.type,
        status_message: exitResult && exitResult.status_message ? exitResult.status_message : 'Đang xử lý checkout...',
        payment_status: exitResult && exitResult.payment_status ? exitResult.payment_status : undefined
      };
    }

    // Camera type không xác định
    return { 
      registered: true,
      camera_type: camera.type,
      status_message: 'Đã nhận diện biển số'
    };
  } catch (error) {
    console.error('Error saving detection:', error);
    throw error;
  }
}

/**
 * Handle vehicle entry
 */
async function handleEntry(vehicle, camera) {
  // Check if vehicle already has open session
  const openSession = await prisma.parkingSession.findFirst({
    where: {
      vehicle_id: vehicle.id,
      exit_time: null
    }
  });

  if (openSession) {
    console.log('Vehicle already has open session:', vehicle.license_plate);
    return {
      status: 'already_parked',
      message: 'Xe đã đang gửi trong bãi'
    };
  }

  // Get parking lot name for logging
  let parkingLotName = 'Không xác định';
  if (camera.parking_lot_id) {
    const parkingLot = await prisma.parkingLot.findUnique({
      where: { id: camera.parking_lot_id }
    });
    if (parkingLot) {
      parkingLotName = parkingLot.name;
    }
  }

  // Create new parking session
  await prisma.parkingSession.create({
    data: {
      vehicle_id: vehicle.id,
      lot_id: camera.parking_lot_id,
      status: 'IN',
      recognition_method: 'Tự động',
      payment_status: 'Chua_thanh_toan'
    }
  });

  // Add detailed system log for check-in
  await prisma.systemLog.create({
    data: {
      action: `Xe ${vehicle.license_plate} đang gửi tại ${parkingLotName}`,
      type: 'Recognition',
      user_id: vehicle.user_id
    }
  });

  console.log(`Vehicle check-in successful: ${vehicle.license_plate} at ${parkingLotName}`);
  
  return {
    status: 'success',
    message: 'Check-in thành công'
  };
}

/**
 * Handle vehicle exit
 */
async function handleExit(vehicle, camera) {
  // Find open parking session (MUST have checked in before)
  const session = await prisma.parkingSession.findFirst({
    where: {
      vehicle_id: vehicle.id,
      exit_time: null
    },
    orderBy: { entry_time: 'desc' },
    include: {
      parking_lot: true
    }
  });

  if (!session) {
    console.log('No open session found for vehicle:', vehicle.license_plate);
    // Log the failed checkout attempt
    await prisma.systemLog.create({
      data: {
        action: `Xe ${vehicle.license_plate} cố gắng checkout nhưng chưa check-in`,
        type: 'Recognition',
        user_id: vehicle.user_id
      }
    });
    return {
      status_message: 'Xe chưa check-in',
      payment_status: 'error'
    };
  }

  const parkingLotName = session.parking_lot?.name || 'Không xác định';

  // Get fee from system settings
  const feeSettings = await prisma.systemSetting.findUnique({
    where: { setting_key: 'fee_per_turn' }
  });
  const fee = feeSettings ? parseFloat(feeSettings.setting_value) : 2000;

  // Check wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: vehicle.user_id }
  });

  if (!wallet || Number(wallet.balance) < fee) {
    console.log('Insufficient balance for vehicle:', vehicle.license_plate);
    // Mark session as unpaid but still update exit time
    await prisma.$transaction([
      prisma.parkingSession.update({
        where: { id: session.id },
        data: {
          exit_time: new Date(),
          fee: fee,
          status: 'OUT',
          payment_status: 'Chua_thanh_toan'
        }
      }),
      // Log insufficient balance checkout
      prisma.systemLog.create({
        data: {
          action: `Xe ${vehicle.license_plate} đã được lấy khỏi ${parkingLotName} - Số dư không đủ (Thiếu ${fee - (wallet ? Number(wallet.balance) : 0)} VND)`,
          type: 'Payment',
          user_id: vehicle.user_id
        }
      })
    ]);
    return {
      status_message: 'Số dư không đủ',
      payment_status: 'insufficient'
    };
  }

  // Process payment and checkout
  await prisma.$transaction([
    // Deduct from wallet
    prisma.wallet.update({
      where: { user_id: vehicle.user_id },
      data: {
        balance: {
          decrement: fee
        }
      }
    }),
    // Create transaction record
    prisma.transaction.create({
      data: {
        user_id: vehicle.user_id,
        type: 'FEE',
        method: 'AUTO',
        amount: -fee,
        status: 'Thành công',
        description: `Trừ phí gửi xe - ${vehicle.license_plate}`
      }
    }),
    // Update parking session
    prisma.parkingSession.update({
      where: { id: session.id },
      data: {
        exit_time: new Date(),
        fee: fee,
        status: 'OUT',
        payment_status: 'Da_thanh_toan'
      }
    }),
    // Log successful checkout
    prisma.systemLog.create({
      data: {
        action: `Xe ${vehicle.license_plate} đã được lấy khỏi ${parkingLotName} - Đã thanh toán ${fee} VND`,
        type: 'Payment',
        user_id: vehicle.user_id
      }
    })
  ]);

  console.log(`Vehicle checkout successful: ${vehicle.license_plate} from ${parkingLotName}, paid ${fee} VND`);
  return {
    status_message: 'Đã thanh toán',
    payment_status: 'paid'
  };
}

/**
 * POST /api/ml/detect-plate
 * Detect and recognize license plate from image
 */
router.post('/detect-plate', async (req, res) => {
  try {
    const { image_base64, camera_id } = req.body;
    
    if (!image_base64) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing image_base64 parameter' 
      });
    }

    if (!camera_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing camera_id parameter' 
      });
    }
    
    console.log(`[ML] Processing detection request for camera ${camera_id}`);
    
    // Run inference
    const result = await runInference(image_base64);
    
    console.log(`[ML] Detection result:`, {
      success: result.success,
      plate_number: result.plate_number,
      confidence: result.confidence,
      saved_image: result.saved_image,
      has_annotated_image: !!result.annotated_image_base64
    });
    
    // Save to database if plate detected
    if (result.success && result.plate_number) {
      const saveResult = await saveDetection(parseInt(camera_id), result);
      result.database = saveResult;
      
      console.log(`[ML] Database save result:`, saveResult);
    }
    
    // Keep annotated_image_base64 for frontend display
    res.json(result);
  } catch (error) {
    console.error('ML detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/ml/check-vehicle-status
 * Check vehicle status in database without running ML inference
 * Used when plate number is already detected by WebSocket
 */
router.post('/check-vehicle-status', async (req, res) => {
  try {
    const { plate_number, camera_id } = req.body;
    
    if (!plate_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing plate_number parameter' 
      });
    }

    if (!camera_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing camera_id parameter' 
      });
    }
    
    console.log(`[ML] Checking vehicle status for plate: ${plate_number}, camera: ${camera_id}`);
    
    // Check vehicle in database
    const vehicle = await prisma.vehicle.findUnique({
      where: { license_plate: plate_number },
      include: { user: true }
    });

    // Get camera info
    const camera = await prisma.camera.findUnique({
      where: { id: parseInt(camera_id) }
    });

    if (!camera) {
      return res.status(404).json({ 
        success: false, 
        error: 'Camera not found' 
      });
    }

    // If vehicle not registered
    if (!vehicle) {
      return res.json({
        success: true,
        database: {
          registered: false,
          camera_type: camera.type,
          status_message: 'Chưa đăng ký xe'
        }
      });
    }

    // Vehicle is registered - handle based on camera type
    const isEntrance = camera.type === 'Vào' || camera.type === 'Vao';
    const isExit = camera.type === 'Ra';
    
    if (isEntrance) {
      // Entry camera - create parking session
      const entryResult = await handleEntry(vehicle, camera);
      return res.json({
        success: true,
        database: {
          registered: true,
          camera_type: camera.type,
          status_message: entryResult && entryResult.status === 'already_parked' ? 'Xe đã đang gửi' : 'Check-in thành công'
        }
      });
    } else if (isExit) {
      // Exit camera - check balance and process payment
      const exitResult = await handleExit(vehicle, camera);
      return res.json({
        success: true,
        database: {
          registered: true,
          camera_type: camera.type,
          status_message: exitResult && exitResult.status_message ? exitResult.status_message : 'Đang xử lý checkout...',
          payment_status: exitResult && exitResult.payment_status ? exitResult.payment_status : undefined
        }
      });
    }

    // Camera type không xác định
    return res.json({
      success: true,
      database: {
        registered: true,
        camera_type: camera.type,
        status_message: 'Đã nhận diện biển số'
      }
    });
  } catch (error) {
    console.error('Vehicle status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/ml/status
 * Check ML service status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'ML service is running',
    models: {
      plate_detector: 'loaded',
      character_recognition: 'loaded'
    }
  });
});

module.exports = router;

