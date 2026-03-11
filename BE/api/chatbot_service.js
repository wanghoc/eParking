const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../lib/prisma');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt cho chatbot - Dành cho sinh viên
const SYSTEM_PROMPT = `Bạn là trợ lý ảo thông minh của hệ thống quản lý bãi đỗ xe eParking - Đại học Đà Lạt.
Bạn đang hỗ trợ một sinh viên tra cứu thông tin cá nhân của họ.

Nhiệm vụ của bạn:
- Tra cứu phiên gửi xe (parking sessions) của sinh viên
- Xem thông tin phương tiện đã đăng ký
- Kiểm tra số dư ví và lịch sử giao dịch
- Xem trạng thái bãi đỗ xe
- Hỗ trợ giải đáp thắc mắc về hệ thống

Lưu ý quan trọng:
- Chỉ trả về thông tin của người dùng đang đăng nhập (userId được cung cấp)
- KHÔNG trả về thông tin của người dùng khác
- Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn và thân thiện
- Định dạng số tiền theo VND (ví dụ: 50,000 VND)
- Định dạng ngày giờ theo múi giờ Việt Nam`;

// Define functions for Gemini to call
const functions = [
  {
    name: 'getMyVehicles',
    description: 'Lấy danh sách phương tiện đã đăng ký của sinh viên',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getMyParkingSessions',
    description: 'Lấy lịch sử phiên gửi xe của sinh viên',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Lọc theo trạng thái: IN (đang gửi) hoặc OUT (đã lấy). Bỏ qua để lấy tất cả'
        },
        limit: {
          type: 'number',
          description: 'Số lượng phiên tối đa. Mặc định: 10'
        }
      }
    }
  },
  {
    name: 'getMyWalletBalance',
    description: 'Kiểm tra số dư ví của sinh viên',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getMyTransactions',
    description: 'Lấy lịch sử giao dịch của sinh viên',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Số lượng giao dịch tối đa. Mặc định: 10'
        }
      }
    }
  },
  {
    name: 'getParkingLotStatus',
    description: 'Xem trạng thái các bãi đỗ xe (còn chỗ không)',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getMyProfile',
    description: 'Lấy thông tin tài khoản của sinh viên',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

// Function implementations - all scoped to current userId
async function getMyVehicles(userId) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { user_id: userId },
      include: {
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
        last_session: v.parking_sessions[0] ? {
          entry_time: v.parking_sessions[0].entry_time,
          exit_time: v.parking_sessions[0].exit_time,
          status: v.parking_sessions[0].status,
          fee: parseFloat(v.parking_sessions[0].fee)
        } : null
      }))
    };
  } catch (error) {
    console.error('Error getting vehicles:', error);
    return { success: false, error: error.message };
  }
}

async function getMyParkingSessions(userId, { status, limit = 10 }) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { user_id: userId },
      select: { id: true }
    });
    const vehicleIds = vehicles.map(v => v.id);

    const whereClause = { vehicle_id: { in: vehicleIds } };
    if (status) whereClause.status = status;

    const sessions = await prisma.parkingSession.findMany({
      where: whereClause,
      include: {
        vehicle: { select: { license_plate: true } },
        parking_lot: { select: { name: true } }
      },
      orderBy: { entry_time: 'desc' },
      take: limit
    });

    return {
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        license_plate: s.vehicle.license_plate,
        parking_lot: s.parking_lot?.name || 'Không xác định',
        entry_time: s.entry_time,
        exit_time: s.exit_time,
        fee: parseFloat(s.fee),
        status: s.status === 'IN' ? 'Đang gửi' : 'Đã lấy',
        payment_status: s.payment_status
      }))
    };
  } catch (error) {
    console.error('Error getting parking sessions:', error);
    return { success: false, error: error.message };
  }
}

async function getMyWalletBalance(userId) {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { user_id: userId }
    });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { user_id: userId, balance: 0 }
      });
    }
    return {
      success: true,
      balance: parseFloat(wallet.balance),
      formatted_balance: `${parseFloat(wallet.balance).toLocaleString('vi-VN')} VND`
    };
  } catch (error) {
    console.error('Error getting wallet:', error);
    return { success: false, error: error.message };
  }
}

async function getMyTransactions(userId, { limit = 10 }) {
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

async function getParkingLotStatus() {
  try {
    const lots = await prisma.parkingLot.findMany();
    return {
      success: true,
      lots: lots.map(lot => ({
        name: lot.name,
        capacity: lot.capacity,
        occupied: lot.occupied,
        available: lot.capacity - lot.occupied,
        status: lot.status
      }))
    };
  } catch (error) {
    console.error('Error getting parking lot status:', error);
    return { success: false, error: error.message };
  }
}

async function getMyProfile(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, mssv: true,
        email: true, phone: true, role: true,
        status: true, created_at: true
      }
    });
    if (!user) return { success: false, message: 'Không tìm thấy người dùng' };
    return { success: true, profile: user };
  } catch (error) {
    console.error('Error getting profile:', error);
    return { success: false, error: error.message };
  }
}

// Main chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const parsedUserId = parseInt(userId);

    // Initialize Gemini model with function calling
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: functions }]
    });

    let filteredHistory = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
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

    let result = await chat.sendMessage(message);
    let response = result.response;

    // Handle function calls
    let functionCalls = response.functionCalls();
    while (functionCalls && functionCalls.length > 0) {
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const functionName = call.name;
          const functionArgs = call.args || {};
          console.log(`[Chatbot] Calling function: ${functionName}`, functionArgs);

          let functionResult;
          switch (functionName) {
            case 'getMyVehicles':
              functionResult = await getMyVehicles(parsedUserId);
              break;
            case 'getMyParkingSessions':
              functionResult = await getMyParkingSessions(parsedUserId, functionArgs);
              break;
            case 'getMyWalletBalance':
              functionResult = await getMyWalletBalance(parsedUserId);
              break;
            case 'getMyTransactions':
              functionResult = await getMyTransactions(parsedUserId, functionArgs);
              break;
            case 'getParkingLotStatus':
              functionResult = await getParkingLotStatus();
              break;
            case 'getMyProfile':
              functionResult = await getMyProfile(parsedUserId);
              break;
            default:
              functionResult = { error: 'Function not found' };
          }

          return {
            functionResponse: {
              name: functionName,
              response: functionResult
            }
          };
        })
      );

      result = await chat.sendMessage(functionResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    const responseText = response.text();

    res.json({
      success: true,
      response: responseText,
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
