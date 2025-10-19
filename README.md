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
