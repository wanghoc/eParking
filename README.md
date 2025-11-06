# eParking System - Hệ thống quản lý bãi xe thông minh

Hệ thống quản lý bãi xe tự động với khả năng nhận diện biển số xe và quản lý thanh toán tích hợp.

## 🚀 Tính năng chính

### 👥 Quản lý người dùng

- Đăng ký/Đăng nhập với MSSV và email
- Quản lý thông tin cá nhân và phương tiện
- Ví điện tử tích hợp với các phương thức thanh toán

### 🚗 Quản lý phương tiện

- Đăng ký xe với biển số, nhãn hiệu, mẫu xe
- Theo dõi lịch sử gửi xe
- Quản lý nhiều xe cho một tài khoản

### 📹 Hệ thống camera

- **Luồng camera trực tiếp**: Xem camera real-time
- **Quản lý camera**: Thêm, sửa, xóa camera
- Hỗ trợ nhiều loại camera: RTSP, HTTP, Yoosee, ONVIF
- Kiểm tra kết nối camera tự động

### 💰 Quản lý thanh toán

- Nạp tiền vào ví qua Momo, VNPay
- Trừ phí tự động khi xe ra bãi
- Lịch sử giao dịch chi tiết
- Cảnh báo số dư thấp

### 🏢 Quản trị hệ thống

- Dashboard tổng quan với thống kê real-time
- Quản lý người dùng và phương tiện
- Cấu hình hệ thống và phí gửi xe
- Theo dõi hoạt động và log hệ thống

## 🛠️ Công nghệ sử dụng

### Frontend

- **React 18** với TypeScript
- **Tailwind CSS** cho styling
- **Lucide React** cho icons
- **React Router** cho navigation

### Backend

- **Node.js** với Express.js
- **Prisma ORM** với PostgreSQL
- **bcrypt** cho mã hóa mật khẩu
- **FFmpeg** cho xử lý video camera

### Database

- **PostgreSQL 16** làm database chính
- **Prisma** làm ORM và migration tool

### Infrastructure

- **Docker & Docker Compose** cho containerization
- **Nginx** làm reverse proxy cho frontend
- **Prisma Studio** cho quản lý database

## 🎥 Realtime License Plate Detection (Socket.IO)

Hệ thống nhận diện biển số realtime sử dụng Socket.IO để stream khung hình từ trình duyệt đến Detector (Flask-SocketIO) và nhận kết quả ngay lập tức, không chặn UI.

### Kiến trúc nhanh

- Frontend (React) phát khung hình từ webcam/camera định kỳ (mặc định ~2 fps đến 10 fps tùy cấu hình UI)
- WebSocket Detector (Python) giữ YOLO + EasyOCR trong bộ nhớ, xử lý mỗi khung <100ms
- Frontend không đổi sang ảnh tĩnh; luôn hiển thị video trực tiếp và vẽ Overlay (khung xanh + text biển số) trên một Canvas trong suốt

Detector chạy trong container Backend và mở cổng 5001:
- WebSocket/HTTP: http://localhost:5001
- Health check: GET http://localhost:5001/health → { status: "healthy", ... }

### Hợp đồng dữ liệu (Socket.IO events)

- Client → Server: `video_frame`
	- Payload:
		- cameraId: string | number
		- image: string (Data URL) – ví dụ: `data:image/jpeg;base64,/9j/4AAQ...`
		- width: number (chiều rộng của ảnh đã gửi)
		- height: number (chiều cao của ảnh đã gửi)
		- ts: number (timestamp ms, tùy chọn)

- Server → Client: `detection_result`
	- Payload:
		- cameraId: string | number
		- detection: {
				plate: string | null,
				confidence: number | null,
				bbox: [x1, y1, x2, y2] | null,  // toạ độ theo không gian ảnh đã gửi
				fps: number | null
			}
		- annotated_frame?: string (Data URL, tuỳ chọn – dùng debug; FE mặc định không hiển thị ảnh này)

Ghi chú toạ độ: bbox được tính theo kích thước ảnh gửi lên (ví dụ 800×600). Ở FE cần scale từ kích thước gốc → kích thước video thực → kích thước khung hiển thị để overlay thẳng hàng.

### Thông số khuyến nghị

- Kích thước khung gửi: tối đa 800×600 (giảm kích thước để tiết kiệm băng thông)
- Định dạng: JPEG base64 (data URL), chất lượng ~0.7–0.8
- Tần số gửi khung: 2–10 fps (tùy CPU/network; 2–4 fps thường đủ cho nhận diện biển số)
- Độ trễ mục tiêu: <100–200ms/frame (tính từ khi gửi đến khi nhận kết quả)
- Tài nguyên Detector: ~2–3GB RAM (YOLO + EasyOCR đã nạp), ổn định theo thời gian

### Tích hợp Frontend (tóm tắt)

- Sử dụng `socket.io-client` kết nối tới ws://<host>:5001
- Gửi `video_frame` định kỳ; giữ video luôn chạy trong `<video>`; vẽ overlay trong `<canvas>` chồng lên video
- Sử dụng callback `onDetection` để cập nhật UI (ví dụ: hiển thị “Biển số nhận dạng” ở Dashboard)

### Tích hợp Model (YOLO + EasyOCR)

- YOLO (Ultralytics) để phát hiện vùng biển số; EasyOCR (vi + en) để đọc ký tự
- Models được nạp 1 lần khi Detector khởi động và tái sử dụng cho mọi khung hình
- File/Thư mục liên quan:
	- `BE/ml_models/utils/websocket_detector.py` – Socket.IO server và vòng lặp nhận diện
	- `BE/ml_models/plate_detector/best.pt` – Trọng số YOLO
	- `BE/ml_models/character_recognition/` – Cấu hình OCR
	- `BE/requirements_ml.txt` – Dependencies (ultralytics, easyocr, opencv, …)

Mẹo độ ổn định: Nếu gặp lỗi lắt nhắt từ Ultralytics/EasyOCR theo từng phiên bản, có thể “pin” version trong `requirements_ml.txt` (ví dụ: `ultralytics==8.2.x`, `easyocr==1.7.x`).

### Troubleshooting Detector

- OpenCV `imdecode` lỗi `!buf.empty()`:
	- Đảm bảo `image` là Data URL đầy đủ (`data:image/jpeg;base64,` + base64)
	- Giảm kích thước ảnh và chất lượng JPEG; tránh payload > ~1.5MB
	- Kiểm tra log Detector để thấy kích thước buffer nhận được

- Socket.IO kết nối thất bại (CORS/network):
	- Mở cổng 5001 trên host; kiểm tra reverse proxy nếu có
	- Đảm bảo cùng origin hoặc cấu hình CORS hợp lệ

- Lỗi Ultralytics kiểu `'Conv' object has no attribute 'bn'` (hiếm, phụ thuộc version):
	- Khởi động lại Detector container
	- Cân nhắc cố định phiên bản `ultralytics` trong `BE/requirements_ml.txt`

### Thử nhanh

1) `docker-compose up -d` để khởi động hệ thống (Backend sẽ mở cổng 5001 cho Detector)
2) Vào trang Admin → Live camera; chọn camera và bật stream
3) Quan sát khung xanh + biển số cập nhật realtime; dòng “Biển số nhận dạng” sẽ thay đổi liên tục theo callback

## 📁 Cấu trúc dự án

```
eParkig/
├── FE/                     # Frontend React
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── api.ts         # API configuration
│   ├── Dockerfile         # Frontend Docker config
│   └── nginx.conf         # Nginx configuration
├── BE/                     # Backend Node.js
│   ├── prisma/            # Database schema & migrations
│   ├── lib/               # Utility libraries
│   ├── server-prisma.js   # Main server file
│   └── Dockerfile         # Backend Docker config
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # This file
```

## 🚀 Cách chạy hệ thống

### Yêu cầu hệ thống

- Docker & Docker Compose
- Git

### Cài đặt và chạy

1. **Clone repository**

```bash
git clone <repository-url>
cd eParkig
```

2. **Chạy hệ thống với Docker**

```bash
# Build và khởi động tất cả services
docker-compose up -d

# Hoặc build lại từ đầu (nếu có thay đổi code)
docker-compose build --no-cache
docker-compose up -d
```

3. **Truy cập ứng dụng**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Prisma Studio**: http://localhost:5555
- **Database**: localhost:3306 (PostgreSQL)

### Các lệnh Docker hữu ích

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f frontend
docker-compose logs -f backend

# Restart service
docker-compose restart frontend

# Dừng tất cả services
docker-compose down

# Xóa tất cả containers và images
docker-compose down --rmi all
```

## 🔧 Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục `BE/`:

```env
DATABASE_URL="postgresql://username:password@postgres:5432/eparking"
PORT=5000
```

### Database Schema

Database schema được định nghĩa trong `BE/prisma/schema.prisma` với các model chính:

- **User**: Thông tin người dùng
- **Vehicle**: Thông tin phương tiện
- **Wallet**: Ví điện tử
- **Transaction**: Giao dịch
- **Camera**: Thông tin camera
- **ParkingSession**: Phiên gửi xe
- **SystemLog**: Log hệ thống

## 📱 Giao diện người dùng

### Trang chủ

- Dashboard với thống kê tổng quan
- Thông tin ví và số dư
- Lịch sử giao dịch gần đây

### Quản lý camera

- **Tab Luồng camera trực tiếp**: Xem camera real-time
- **Tab Quản lý camera**: Thêm, sửa, xóa camera
- Hỗ trợ nhiều loại camera và protocol

### Quản lý xe

- Danh sách xe đã đăng ký
- Thêm/xóa xe
- Lịch sử gửi xe

### Quản trị hệ thống

- Dashboard admin với thống kê tổng quan
- Quản lý người dùng và phương tiện
- Cấu hình hệ thống

## 🔒 Bảo mật

- Mật khẩu được mã hóa với bcrypt
- Validation đầu vào đầy đủ
- CORS được cấu hình đúng cách
- SQL injection được ngăn chặn bởi Prisma ORM

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Container không khởi động**

```bash
# Kiểm tra logs
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

2. **Database connection error**

```bash
# Kiểm tra PostgreSQL container
docker-compose ps postgres

# Restart database
docker-compose restart postgres
```

3. **Frontend không load**

```bash
# Clear browser cache
Ctrl + Shift + R (Hard refresh)

# Hoặc sử dụng Incognito mode
```

4. **Camera không hiển thị**

- Kiểm tra IP address và port của camera
- Đảm bảo camera hỗ trợ protocol được chọn
- Kiểm tra username/password nếu có

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs của container: `docker-compose logs`
2. Đảm bảo tất cả services đang chạy: `docker-compose ps`
3. Thử rebuild containers: `docker-compose build --no-cache`

## 📄 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu tại Trường Đại học Đà Lạt - CTK46PM.
