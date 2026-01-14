const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../lib/prisma');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt cho chatbot
const SYSTEM_PROMPT = `Bạn là trợ lý ảo thông minh của hệ thống quản lý bãi đỗ xe eParking.
Nhiệm vụ của bạn là trả lời câu hỏi của người dùng về:
- Thông tin biển số xe, phương tiện
- Lịch sử gửi xe, phiên đỗ xe (parking sessions)
- Hóa đơn, thanh toán, giao dịch
- Doanh thu, thống kê theo ngày/tháng
- Thông tin người dùng và ví tiền
- Nhận diện biển số xe từ hình ảnh

Bạn có thể sử dụng các function để truy vấn database PostgreSQL.
Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn và thân thiện.
Định dạng số tiền theo VND (ví dụ: 50,000 VND).
Định dạng ngày giờ theo múi giờ Việt Nam (VN timezone).`;

// Define functions for Gemini to call
const functions = [
  {
    name: 'searchVehiclesByLicensePlate',
    description: 'Tìm kiếm phương tiện theo biển số xe. Hỗ trợ tìm kiếm theo tiền tố (ví dụ: "49")',
    parameters: {
      type: 'object',
      properties: {
        platePrefix: {
          type: 'string',
          description: 'Tiền tố hoặc biển số xe cần tìm (ví dụ: "49", "49A", "49A-12345")'
        },
        exactMatch: {
          type: 'boolean',
          description: 'True nếu tìm chính xác, false nếu tìm theo tiền tố. Mặc định: false'
        }
      },
      required: ['platePrefix']
    }
  },
  {
    name: 'getRevenueByDateRange',
    description: 'Lấy doanh thu theo khoảng thời gian',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Ngày bắt đầu (ISO format: YYYY-MM-DD hoặc YYYY-MM-DDTHH:MM:SS)'
        },
        endDate: {
          type: 'string',
          description: 'Ngày kết thúc (ISO format: YYYY-MM-DD hoặc YYYY-MM-DDTHH:MM:SS)'
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'getRecentRevenue',
    description: 'Lấy doanh thu trong N ngày gần nhất',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Số ngày gần nhất cần lấy doanh thu'
        }
      },
      required: ['days']
    }
  },
  {
    name: 'getParkingSessionsByDateRange',
    description: 'Lấy danh sách phiên đỗ xe theo khoảng thời gian',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Ngày bắt đầu (ISO format)'
        },
        endDate: {
          type: 'string',
          description: 'Ngày kết thúc (ISO format)'
        },
        status: {
          type: 'string',
          description: 'Trạng thái: IN (đang gửi) hoặc OUT (đã ra). Bỏ qua để lấy tất cả'
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'getVehicleInfo',
    description: 'Lấy thông tin chi tiết của một phương tiện theo biển số',
    parameters: {
      type: 'object',
      properties: {
        licensePlate: {
          type: 'string',
          description: 'Biển số xe cần tra cứu'
        }
      },
      required: ['licensePlate']
    }
  },
  {
    name: 'getUserTransactions',
    description: 'Lấy lịch sử giao dịch của người dùng',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'ID người dùng'
        },
        limit: {
          type: 'number',
          description: 'Số lượng giao dịch tối đa. Mặc định: 10'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'getParkingLotStatus',
    description: 'Lấy trạng thái hiện tại của bãi đỗ xe',
    parameters: {
      type: 'object',
      properties: {
        lotId: {
          type: 'number',
          description: 'ID của bãi đỗ xe. Bỏ qua để lấy tất cả'
        }
      }
    }
  },
  {
    name: 'getTodayStatistics',
    description: 'Lấy thống kê tổng quan của ngày hôm nay',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

// Function implementations
async function searchVehiclesByLicensePlate({ platePrefix, exactMatch = false }) {
  try {
    const whereClause = exactMatch
      ? { license_plate: platePrefix }
      : { license_plate: { startsWith: platePrefix } };

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            mssv: true
          }
        },
        parking_sessions: {
          orderBy: { entry_time: 'desc' },
          take: 1
        }
      }
    });

    return {
      success: true,
      count: vehicles.length,
      vehicles: vehicles.map(v => ({
        id: v.id,
        license_plate: v.license_plate,
        brand: v.brand,
        model: v.model,
        vehicle_type: v.vehicle_type,
        owner: {
          name: v.user.username,
          email: v.user.email,
          phone: v.user.phone,
          mssv: v.user.mssv
        },
        last_session: v.parking_sessions[0] || null
      }))
    };
  } catch (error) {
    console.error('Error searching vehicles:', error);
    return { success: false, error: error.message };
  }
}

async function getRevenueByDateRange({ startDate, endDate }) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    const sessions = await prisma.parkingSession.findMany({
      where: {
        exit_time: {
          gte: start,
          lte: end
        },
        payment_status: 'Da_thanh_toan'
      },
      select: {
        fee: true,
        exit_time: true
      }
    });

    const totalRevenue = sessions.reduce((sum, session) => 
      sum + parseFloat(session.fee), 0);

    // Group by date
    const revenueByDate = {};
    sessions.forEach(session => {
      const date = session.exit_time.toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += parseFloat(session.fee);
    });

    return {
      success: true,
      totalRevenue,
      sessionCount: sessions.length,
      revenueByDate,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
  } catch (error) {
    console.error('Error getting revenue:', error);
    return { success: false, error: error.message };
  }
}

async function getRecentRevenue({ days }) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getRevenueByDateRange({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
}

async function getParkingSessionsByDateRange({ startDate, endDate, status }) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const whereClause = {
      entry_time: {
        gte: start,
        lte: end
      }
    };

    if (status) {
      whereClause.status = status;
    }

    const sessions = await prisma.parkingSession.findMany({
      where: whereClause,
      include: {
        vehicle: {
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { entry_time: 'desc' }
    });

    return {
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        license_plate: s.vehicle.license_plate,
        owner: s.vehicle.user.username,
        entry_time: s.entry_time,
        exit_time: s.exit_time,
        fee: parseFloat(s.fee),
        status: s.status,
        payment_status: s.payment_status
      }))
    };
  } catch (error) {
    console.error('Error getting parking sessions:', error);
    return { success: false, error: error.message };
  }
}

async function getVehicleInfo({ licensePlate }) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { license_plate: licensePlate },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            mssv: true
          }
        },
        parking_sessions: {
          orderBy: { entry_time: 'desc' },
          take: 5
        }
      }
    });

    if (!vehicle) {
      return { success: false, message: 'Không tìm thấy phương tiện' };
    }

    return {
      success: true,
      vehicle: {
        license_plate: vehicle.license_plate,
        brand: vehicle.brand,
        model: vehicle.model,
        vehicle_type: vehicle.vehicle_type,
        created_at: vehicle.created_at,
        owner: vehicle.user,
        recent_sessions: vehicle.parking_sessions.map(s => ({
          entry_time: s.entry_time,
          exit_time: s.exit_time,
          fee: parseFloat(s.fee),
          status: s.status,
          payment_status: s.payment_status
        }))
      }
    };
  } catch (error) {
    console.error('Error getting vehicle info:', error);
    return { success: false, error: error.message };
  }
}

async function getUserTransactions({ userId, limit = 10 }) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return {
      success: true,
      count: transactions.length,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        method: t.method,
        amount: parseFloat(t.amount),
        status: t.status,
        description: t.description,
        created_at: t.created_at
      }))
    };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { success: false, error: error.message };
  }
}

async function getParkingLotStatus({ lotId }) {
  try {
    const whereClause = lotId ? { id: lotId } : {};
    
    const lots = await prisma.parkingLot.findMany({
      where: whereClause,
      include: {
        parking_sessions: {
          where: { status: 'IN' },
          include: {
            vehicle: true
          }
        }
      }
    });

    return {
      success: true,
      lots: lots.map(lot => ({
        id: lot.id,
        name: lot.name,
        capacity: lot.capacity,
        occupied: lot.occupied,
        available: lot.capacity - lot.occupied,
        fee_per_turn: parseFloat(lot.fee_per_turn),
        status: lot.status,
        current_vehicles: lot.parking_sessions.map(s => ({
          license_plate: s.vehicle.license_plate,
          entry_time: s.entry_time
        }))
      }))
    };
  } catch (error) {
    console.error('Error getting parking lot status:', error);
    return { success: false, error: error.message };
  }
}

async function getTodayStatistics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count sessions today
    const sessionsToday = await prisma.parkingSession.count({
      where: {
        entry_time: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Count currently parked
    const currentlyParked = await prisma.parkingSession.count({
      where: { status: 'IN' }
    });

    // Revenue today
    const revenueResult = await prisma.parkingSession.aggregate({
      where: {
        exit_time: {
          gte: today,
          lt: tomorrow
        },
        payment_status: 'Da_thanh_toan'
      },
      _sum: {
        fee: true
      }
    });

    // Vehicles with license plates starting with specific prefix today
    const sessionsWithVehicles = await prisma.parkingSession.findMany({
      where: {
        entry_time: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        vehicle: true
      }
    });

    return {
      success: true,
      today: today.toISOString().split('T')[0],
      statistics: {
        total_sessions: sessionsToday,
        currently_parked: currentlyParked,
        revenue: parseFloat(revenueResult._sum.fee || 0),
        unique_vehicles: new Set(sessionsWithVehicles.map(s => s.vehicle.license_plate)).size
      }
    };
  } catch (error) {
    console.error('Error getting today statistics:', error);
    return { success: false, error: error.message };
  }
}

// Function dispatcher
const functionHandlers = {
  searchVehiclesByLicensePlate,
  getRevenueByDateRange,
  getRecentRevenue,
  getParkingSessionsByDateRange,
  getVehicleInfo,
  getUserTransactions,
  getParkingLotStatus,
  getTodayStatistics
};

// License plate recognition from image
async function recognizeLicensePlate(imageBase64) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml_models/character_recognition/plate_recognizer_inference.py');
    
    // Create temp file for image
    const tempImagePath = path.join(__dirname, '../temp_plate.jpg');
    const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
    fs.writeFileSync(tempImagePath, imageBuffer);

    const pythonProcess = spawn('python', [pythonScript, '--image', tempImagePath]);
    
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempImagePath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }

      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse recognition result: ' + output));
        }
      } else {
        reject(new Error('Recognition failed: ' + errorOutput));
      }
    });
  });
}

// Main chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, image, conversationHistory = [] } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    let responseText = '';
    let recognizedPlate = null;

    // If image is provided, recognize license plate first
    if (image) {
      try {
        const recognition = await recognizeLicensePlate(image);
        recognizedPlate = recognition.license_plate || recognition.text;
        
        // Add recognized plate to the message
        const plateMessage = message 
          ? `${message} (Biển số nhận diện được: ${recognizedPlate})`
          : `Biển số xe trong ảnh là: ${recognizedPlate}`;

        // Continue with Gemini to answer the question about the plate
        message = plateMessage;
      } catch (error) {
        console.error('Error recognizing plate:', error);
        return res.status(500).json({ 
          error: 'Không thể nhận diện biển số xe',
          details: error.message 
        });
      }
    }

    // Initialize Gemini model with function calling
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: functions }]
    });

    // Build conversation history
    // Gemini requires role to be 'user' or 'model', not 'assistant'
    // First message must be from 'user'
    let filteredHistory = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
    
    // Remove leading model messages
    while (filteredHistory.length > 0 && filteredHistory[0].role === 'model') {
      filteredHistory.shift();
    }

    const chat = model.startChat({
      history: filteredHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    // Send message
    let result = await chat.sendMessage(message);
    let response = result.response;

    // Handle function calls
    let functionCalls = response.functionCalls();
    while (functionCalls && functionCalls.length > 0) {
      // Execute all function calls
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const functionName = call.name;
          const functionArgs = call.args;
          
          console.log(`Calling function: ${functionName}`, functionArgs);
          
          const handler = functionHandlers[functionName];
          if (handler) {
            const functionResult = await handler(functionArgs);
            return {
              functionResponse: {
                name: functionName,
                response: functionResult
              }
            };
          } else {
            return {
              functionResponse: {
                name: functionName,
                response: { error: 'Function not found' }
              }
            };
          }
        })
      );

      // Send function results back to model
      result = await chat.sendMessage(functionResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    // Get final text response
    responseText = response.text();

    res.json({
      success: true,
      response: responseText,
      recognizedPlate: recognizedPlate,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      error: 'Đã xảy ra lỗi khi xử lý yêu cầu',
      details: error.message
    });
  }
});

module.exports = router;
