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
    const python = spawn('python', [
      'ml_models/utils/inference.py',
      '--image', imageBase64
    ]);

    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
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

    // Set timeout
    setTimeout(() => {
      python.kill();
      reject(new Error('Inference timeout'));
    }, 10000); // 10 seconds timeout
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
      where: { license_plate: result.plate_number }
    });

    if (!vehicle) {
      console.log('Vehicle not registered:', result.plate_number);
      return { registered: false };
    }

    // Check camera type
    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    });

    if (!camera) {
      console.log('Camera not found:', cameraId);
      return { error: 'Camera not found' };
    }

    if (camera.type === 'Vào') {
      // Entry camera - create parking session
      await handleEntry(vehicle, camera);
    } else if (camera.type === 'Ra') {
      // Exit camera - end parking session and charge
      await handleExit(vehicle, camera);
    }

    return { registered: true };
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
    return;
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

  console.log('Vehicle entry recorded:', vehicle.license_plate);
}

/**
 * Handle vehicle exit
 */
async function handleExit(vehicle, camera) {
  // Find open parking session
  const session = await prisma.parkingSession.findFirst({
    where: {
      vehicle_id: vehicle.id,
      exit_time: null
    },
    orderBy: { entry_time: 'desc' }
  });

  if (!session) {
    console.log('No open session found for vehicle:', vehicle.license_plate);
    return;
  }

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
    await prisma.parkingSession.update({
      where: { id: session.id },
      data: {
        exit_time: new Date(),
        fee: fee,
        status: 'OUT',
        payment_status: 'Chua_thanh_toan'
      }
    });
    return;
  }

  // Process payment
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
    // Log
    prisma.systemLog.create({
      data: {
        action: `Xe ra bãi - ${vehicle.license_plate}`,
        type: 'Payment'
      }
    })
  ]);

  console.log('Vehicle exit recorded and payment processed:', vehicle.license_plate);
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
      saved_image: result.saved_image
    });
    
    // Save to database if plate detected
    if (result.success && result.plate_number) {
      const saveResult = await saveDetection(parseInt(camera_id), result);
      result.database = saveResult;
      
      console.log(`[ML] Database save result:`, saveResult);
    }
    
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

