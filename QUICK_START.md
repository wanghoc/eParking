# Quick Start Guide - Chatbot eParking

## ✅ Đã hoàn thành

### Backend
- ✅ Đã cài đặt dependencies (@google/generative-ai)
- ✅ Đã tạo chatbot service (BE/api/chatbot_service.js)
- ✅ Đã tích hợp vào server (BE/server-prisma.js)
- ✅ Đã cấu hình .env với GEMINI_API_KEY

### Frontend
- ✅ Đã tạo ChatBot component (FE/src/components/ChatBot.tsx)
- ✅ Đã tích hợp vào App.tsx
- ✅ Đã thêm floating button

## 🚀 Cách khởi động

### 1. Khởi động Backend

```powershell
cd BE
npm start
```

Backend sẽ chạy trên http://localhost:5000

### 2. Khởi động Frontend (Terminal mới)

```powershell
cd FE
npm start
```

Frontend sẽ chạy trên http://localhost:3000

### 3. Test Chatbot API (Optional)

Sau khi backend chạy, mở terminal mới:

```powershell
cd BE
node test-chatbot.js
```

## 📝 Cách sử dụng

1. Mở trình duyệt: http://localhost:3000
2. Đăng nhập vào hệ thống
3. Click nút chatbot màu xanh ở góc dưới bên phải
4. Bắt đầu hỏi câu hỏi!

### Ví dụ câu hỏi:

```
✅ Cho tôi biết hôm nay có bao nhiêu biển số có đầu 49
✅ Doanh thu 3 ngày gần nhất là bao nhiêu?
✅ Có bao nhiêu xe đang gửi trong bãi?
✅ Xe biển số 49A-12345 của ai?
✅ Thống kê hôm nay
```

### Upload ảnh biển số:

1. Click icon 📷 trong chatbot
2. Chọn ảnh biển số
3. Hỏi: "Đây là xe của ai?" hoặc "Xe này có lịch sử gửi không?"

## ⚙️ Cấu hình

### GEMINI_API_KEY

File `.env` đã có sẵn API key:
```
GEMINI_API_KEY=AIzaSyDUT0jlMXymdXfANoBhY4cbqjr1U1rjusA
```

Nếu muốn đổi key mới:
1. Lấy từ: https://makersuite.google.com/app/apikey
2. Sửa trong file `.env`
3. Restart backend

## 🔍 Troubleshooting

### Backend không khởi động

**Lỗi:** "Cannot find module '@google/generative-ai'"
```powershell
cd BE
npm install
```

**Lỗi:** Database connection failed
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra DB_USER, DB_PASSWORD trong .env

### Frontend không kết nối được chatbot

1. Kiểm tra backend đang chạy: http://localhost:5000/api/health
2. Kiểm tra REACT_APP_API_URL trong .env: `http://localhost:5000`
3. Restart frontend

### Chatbot trả lời lỗi

1. Check console log trong browser (F12)
2. Check terminal backend để xem error
3. Kiểm tra GEMINI_API_KEY hợp lệ

## 📂 Files đã tạo/sửa

### Backend
- `BE/package.json` - Added @google/generative-ai
- `BE/api/chatbot_service.js` - Chatbot service với Gemini AI
- `BE/server-prisma.js` - Added /api/chatbot route
- `BE/test-chatbot.js` - Test script

### Frontend
- `FE/src/components/ChatBot.tsx` - ChatBot UI component
- `FE/src/App.tsx` - Integrated ChatBot

### Docs
- `.env.example` - Environment variables template
- `CHATBOT_README.md` - Detailed documentation
- `INSTALLATION.md` - Installation guide
- `QUICK_START.md` - This file

## 🎯 Các tính năng

### 8 Function calls cho Gemini AI:
1. ✅ searchVehiclesByLicensePlate - Tìm xe theo biển số
2. ✅ getRevenueByDateRange - Doanh thu theo khoảng thời gian
3. ✅ getRecentRevenue - Doanh thu N ngày gần nhất
4. ✅ getParkingSessionsByDateRange - Phiên đỗ xe
5. ✅ getVehicleInfo - Thông tin chi tiết xe
6. ✅ getUserTransactions - Lịch sử giao dịch
7. ✅ getParkingLotStatus - Trạng thái bãi đỗ
8. ✅ getTodayStatistics - Thống kê hôm nay

### UI Features:
- ✅ Chat interface hiện đại
- ✅ Upload và preview ảnh
- ✅ Nhận diện biển số từ ảnh
- ✅ Lịch sử hội thoại
- ✅ Tối đa hóa/thu nhỏ
- ✅ Floating button
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

## 📊 Architecture

```
User Question
    ↓
Frontend (ChatBot.tsx)
    ↓
POST /api/chatbot/chat
    ↓
Backend (chatbot_service.js)
    ↓
Gemini AI (Function Calling)
    ↓
Database Queries (Prisma)
    ↓
Response → Frontend → User
```

## 🎉 Hoàn thành!

Chatbot đã sẵn sàng sử dụng. Chỉ cần:
1. `cd BE && npm start`
2. `cd FE && npm start`
3. Mở http://localhost:3000
4. Bắt đầu chat!

---

**Support:** Nếu gặp vấn đề, check terminal logs và browser console (F12).
