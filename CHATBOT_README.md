# eParking Chatbot - Hướng dẫn cài đặt và sử dụng

## Tổng quan

Chatbot eParking sử dụng Gemini AI để xử lý ngôn ngữ tự nhiên và truy vấn dữ liệu từ hệ thống quản lý bãi đỗ xe. Chatbot hỗ trợ:

- ✅ Tra cứu thông tin biển số xe
- ✅ Thống kê doanh thu theo ngày/tuần/tháng
- ✅ Xem lịch sử gửi xe và thanh toán
- ✅ Nhận diện biển số xe từ hình ảnh
- ✅ Truy vấn thông tin phương tiện và chủ xe

## Cài đặt

### 1. Cài đặt dependencies cho Backend

```bash
cd BE
npm install
```

Package `@google/generative-ai` đã được thêm vào `package.json`.

### 2. Cấu hình Gemini API Key

1. Lấy API key từ: https://makersuite.google.com/app/apikey
2. Tạo file `.env` trong thư mục gốc (nếu chưa có)
3. Thêm cấu hình:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Khởi động Backend

```bash
cd BE
npm start
```

Backend sẽ chạy trên `http://localhost:5000` với endpoint chatbot tại `/api/chatbot/chat`.

### 4. Khởi động Frontend

```bash
cd FE
npm install
npm start
```

Frontend sẽ chạy trên `http://localhost:3000`.

## Cách sử dụng

### Mở Chatbot

Khi đăng nhập vào hệ thống, bạn sẽ thấy nút chatbot màu xanh ở góc dưới bên phải màn hình.

### Các câu hỏi mẫu

#### 1. Tra cứu biển số xe

```
Cho tôi biết hôm nay có bao nhiêu biển số có đầu 49
```

```
Tìm tất cả xe có biển số bắt đầu bằng 49A
```

```
Xe biển số 49A-12345 của ai?
```

#### 2. Thống kê doanh thu

```
Cho tôi biết doanh thu 3 ngày gần nhất
```

```
Doanh thu hôm nay là bao nhiêu?
```

```
Thống kê doanh thu từ ngày 1/1/2026 đến 10/1/2026
```

#### 3. Lịch sử gửi xe

```
Có bao nhiêu xe đang gửi trong bãi?
```

```
Cho tôi xem lịch sử xe ra vào trong tuần này
```

```
Xe nào vào hôm nay mà chưa ra?
```

#### 4. Nhận diện biển số từ ảnh

1. Click vào icon **📷** để tải lên hình ảnh biển số
2. Hỏi câu hỏi kèm theo:
   - "Đây là biển số xe của ai?"
   - "Xe này có lịch sử gửi xe không?"
   - "Chủ xe này là ai?"

### Tối đa hóa/Thu nhỏ

- Click icon **⬜** để tối đa hóa cửa sổ chat
- Click icon **−** để thu nhỏ lại

### Đóng Chatbot

Click nút **✕** trên thanh header của chatbot.

## Kiến trúc

### Backend (BE/api/chatbot_service.js)

```
POST /api/chatbot/chat
Body: {
  message: string,        // Tin nhắn người dùng
  image?: string,         // Base64 image (optional)
  conversationHistory?: Array // Lịch sử hội thoại
}

Response: {
  success: boolean,
  response: string,       // Phản hồi từ Gemini
  recognizedPlate?: string, // Biển số nhận diện (nếu có ảnh)
  timestamp: string
}
```

### Function Calling

Gemini AI được cấu hình với các function declarations để truy vấn database:

1. **searchVehiclesByLicensePlate** - Tìm xe theo biển số
2. **getRevenueByDateRange** - Lấy doanh thu theo khoảng thời gian
3. **getRecentRevenue** - Doanh thu N ngày gần nhất
4. **getParkingSessionsByDateRange** - Lấy phiên đỗ xe theo thời gian
5. **getVehicleInfo** - Thông tin chi tiết phương tiện
6. **getUserTransactions** - Lịch sử giao dịch
7. **getParkingLotStatus** - Trạng thái bãi đỗ xe
8. **getTodayStatistics** - Thống kê tổng quan hôm nay

### Frontend (FE/src/components/ChatBot.tsx)

- UI chat hiện đại với Tailwind CSS
- Hỗ trợ upload và preview ảnh
- Hiển thị biển số nhận diện được
- Lịch sử hội thoại
- Responsive design

## Xử lý lỗi

### Lỗi: "GEMINI_API_KEY is not defined"

**Nguyên nhân:** Chưa cấu hình API key

**Giải pháp:**
1. Lấy API key từ Google AI Studio
2. Thêm vào file `.env`: `GEMINI_API_KEY=your_key_here`
3. Restart backend

### Lỗi: "Không thể nhận diện biển số xe"

**Nguyên nhân:** 
- Python không được cài đặt
- Model nhận diện chưa có
- Ảnh không rõ ràng

**Giải pháp:**
1. Đảm bảo Python đã được cài đặt
2. Kiểm tra file model tại `BE/ml_models/character_recognition/plate_recognizer.pt`
3. Thử với ảnh biển số rõ ràng hơn

### Lỗi: Function calling không hoạt động

**Nguyên nhân:** Database connection issue

**Giải pháp:**
1. Kiểm tra `DATABASE_URL` trong `.env`
2. Đảm bảo PostgreSQL đang chạy
3. Chạy `npx prisma generate` để sync schema

## Tùy chỉnh

### Thay đổi System Prompt

Chỉnh sửa `SYSTEM_PROMPT` trong [chatbot_service.js](BE/api/chatbot_service.js#L12):

```javascript
const SYSTEM_PROMPT = `Bạn là trợ lý ảo...`;
```

### Thêm Function mới

1. Thêm function declaration vào array `functions`
2. Implement handler function
3. Thêm vào `functionHandlers` object

### Thay đổi Model Gemini

Trong [chatbot_service.js](BE/api/chatbot_service.js#L508):

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro', // Thay đổi model
  // ...
});
```

## Giới hạn

- Gemini API có rate limit (tùy thuộc vào tier)
- Nhận diện biển số cần Python và model đã được train
- Kích thước ảnh upload tối đa: 10MB

## Troubleshooting

### Debug Mode

Thêm log trong chatbot service:

```javascript
console.log('Function called:', functionName, functionArgs);
console.log('Function result:', functionResult);
```

### Test API trực tiếp

```bash
curl -X POST http://localhost:5000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cho tôi biết thống kê hôm nay"
  }'
```

## Support

Nếu gặp vấn đề, vui lòng kiểm tra:
- Console logs trong browser (F12)
- Backend terminal logs
- Network tab để xem request/response

---

**Phát triển bởi:** eParking Team  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 14/01/2026
