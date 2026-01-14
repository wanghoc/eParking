/**
 * Test script for Chatbot API
 * Run: node test-chatbot.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/chatbot/chat';

// Test cases
const testCases = [
  {
    name: 'Test 1: Thống kê hôm nay',
    message: 'Cho tôi biết thống kê hôm nay'
  },
  {
    name: 'Test 2: Tìm biển số',
    message: 'Cho tôi biết hôm nay có bao nhiêu biển số có đầu 49'
  },
  {
    name: 'Test 3: Doanh thu',
    message: 'Doanh thu 3 ngày gần nhất là bao nhiêu?'
  },
  {
    name: 'Test 4: Xe đang gửi',
    message: 'Có bao nhiêu xe đang gửi trong bãi?'
  }
];

async function testChatbot(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Câu hỏi: ${testCase.message}\n`);

  try {
    const startTime = Date.now();
    const response = await axios.post(API_URL, {
      message: testCase.message,
      conversationHistory: []
    });
    const endTime = Date.now();

    if (response.data.success) {
      console.log(`✅ Thành công (${endTime - startTime}ms)`);
      console.log(`Trả lời:\n${response.data.response}`);
      if (response.data.recognizedPlate) {
        console.log(`\n🚗 Biển số nhận diện: ${response.data.recognizedPlate}`);
      }
    } else {
      console.log(`❌ Lỗi: ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Lỗi kết nối: ${error.message}`);
    if (error.response?.data) {
      console.log(`Chi tiết: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function runTests() {
  console.log('\n🤖 Testing eParking Chatbot API');
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Thời gian: ${new Date().toLocaleString('vi-VN')}`);

  // Test health check first
  try {
    const health = await axios.get('http://localhost:5000/api/health');
    console.log(`\n✅ Backend is running (${health.data.ok ? 'OK' : 'NOT OK'})`);
  } catch (error) {
    console.log('\n❌ Backend không chạy. Vui lòng khởi động backend trước!');
    console.log('   Run: npm start');
    return;
  }

  // Run all test cases
  for (const testCase of testCases) {
    await testChatbot(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1s giữa các test
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Hoàn thành tất cả test cases');
  console.log(`${'='.repeat(60)}\n`);
}

// Run tests
runTests().catch(console.error);
