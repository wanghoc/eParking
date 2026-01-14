# Hướng dẫn cài đặt Chatbot eParking

## Yêu cầu hệ thống

- Node.js 16+ và npm
- Python 3.8+ (cho nhận diện biển số)
- PostgreSQL database đang chạy
- Gemini API Key

## Các bước cài đặt

### Bước 1: Cài đặt Backend Dependencies

Mở terminal và chạy:

```bash
cd BE
npm install
```

Lệnh này sẽ cài đặt package `@google/generative-ai` và các dependencies khác.

### Bước 2: Cấu hình Gemini API Key

1. Truy cập https://makersuite.google.com/app/apikey để lấy API key
2. Copy file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
3. Mở file `.env` và thêm API key:
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

### Bước 3: Khởi động Backend

```bash
cd BE
npm start
```

Server sẽ chạy trên http://localhost:5000

### Bước 4: Cài đặt Frontend Dependencies (nếu cần)

```bash
cd FE
npm install
npm start
```

Frontend sẽ chạy trên http://localhost:3000

## Kiểm tra cài đặt

### Test API endpoint

```bash
curl -X POST http://localhost:5000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Cho tôi biết thống kê hôm nay"}'
```

Nếu thành công, bạn sẽ nhận được response JSON từ chatbot.

### Test trên UI

1. Mở http://localhost:3000
2. Đăng nhập vào hệ thống
3. Click vào nút chatbot màu xanh ở góc dưới bên phải
4. Thử hỏi: "Hôm nay có bao nhiêu xe vào?"

## Nếu không có npm/node

### Windows:

1. Tải Node.js từ https://nodejs.org/
2. Chạy installer và làm theo hướng dẫn
3. Mở lại terminal mới
4. Kiểm tra: `node --version` và `npm --version`

### Alternative: Sử dụng Docker

Nếu project có file docker-compose.yml:

```bash
docker-compose up --build
```

## Troubleshooting

### Lỗi "npm is not recognized"

**Giải pháp:**
- Cài đặt Node.js từ https://nodejs.org/
- Restart terminal sau khi cài đặt

### Lỗi "GEMINI_API_KEY is not defined"

**Giải pháp:**
- Đảm bảo file `.env` có `GEMINI_API_KEY=your_key`
- Restart backend server

### Lỗi kết nối database

**Giải pháp:**
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra `DATABASE_URL` trong `.env`
- Chạy: `npx prisma generate && npx prisma db push`

## Các file đã thêm/sửa đổi

### Backend:
- ✅ `BE/package.json` - Thêm @google/generative-ai
- ✅ `BE/api/chatbot_service.js` - Service xử lý chatbot
- ✅ `BE/server-prisma.js` - Thêm route /api/chatbot

### Frontend:
- ✅ `FE/src/components/ChatBot.tsx` - UI component chatbot
- ✅ `FE/src/App.tsx` - Tích hợp chatbot vào app

### Config:
- ✅ `.env.example` - Template cấu hình
- ✅ `CHATBOT_README.md` - Hướng dẫn chi tiết

## Chức năng đã triển khai

### ✅ Xử lý ngôn ngữ tự nhiên với Gemini AI
- Gemini 1.5 Flash model
- System prompt tùy chỉnh cho eParking
- Function calling để query database

### ✅ Truy vấn Database
- Tìm kiếm biển số xe (theo tiền tố hoặc chính xác)
- Thống kê doanh thu (theo ngày, theo khoảng thời gian)
- Lịch sử phiên đỗ xe
- Thông tin chi tiết phương tiện
- Giao dịch người dùng
- Trạng thái bãi đỗ xe
- Thống kê tổng quan

### ✅ Nhận diện biển số từ ảnh
- Tích hợp với model CNN-LSTM đã có sẵn
- Upload ảnh qua UI
- Trả về biển số nhận diện + thông tin liên quan

### ✅ Giao diện người dùng
- UI chat hiện đại, responsive
- Support upload ảnh
- Lịch sử hội thoại
- Tối đa hóa/thu nhỏ
- Floating button
- Loading states
- Error handling

## Ví dụ sử dụng

```
User: "Cho tôi biết hôm nay có bao nhiêu biển số có đầu 49"
Bot: Tìm thấy X xe có biển số bắt đầu bằng 49...

User: "Doanh thu 3 ngày gần nhất là bao nhiêu?"
Bot: Doanh thu 3 ngày gần nhất:
- Ngày X: XXX,XXX VND
- Ngày Y: YYY,YYY VND
...

User: [Upload ảnh biển số] "Đây là xe của ai?"
Bot: Biển số: 49A-12345
Chủ xe: Nguyễn Văn A
MSSV: 123456
...
```

## Cấu trúc Function Calling

Backend định nghĩa 8 functions cho Gemini AI:
1. searchVehiclesByLicensePlate
2. getRevenueByDateRange
3. getRecentRevenue
4. getParkingSessionsByDateRange
5. getVehicleInfo
6. getUserTransactions
7. getParkingLotStatus
8. getTodayStatistics

Gemini AI sẽ tự động chọn function phù hợp dựa trên câu hỏi của người dùng.

---

**Lưu ý quan trọng:**
- Cần có GEMINI_API_KEY hợp lệ
- Backend phải chạy trước khi test frontend
- Database phải có dữ liệu mẫu để test
