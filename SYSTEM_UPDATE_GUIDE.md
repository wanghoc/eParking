# Hướng Dẫn Cập Nhật Hệ Thống eParking

## 📋 Tổng Quan Thay Đổi

Hệ thống đã được cập nhật hoàn toàn để sử dụng **PostgreSQL với Prisma ORM**, loại bỏ hoàn toàn MySQL.

### Các Thay Đổi Chính:

1. ✅ **Backend**:

   - Chuyển từ `server.js` (MySQL) sang `server-prisma.js` (PostgreSQL + Prisma)
   - Loại bỏ `db.js` và `mysql2` dependency
   - Loại bỏ `schema-mysql.sql`
   - Thêm đầy đủ API endpoints cho tất cả tính năng

2. ✅ **Frontend**:

   - Loại bỏ trang chủ cho admin role
   - Admin được redirect tự động tới Dashboard
   - Hoàn thiện trang "Quản lý trực tiếp" với:
     - Chọn camera từ danh sách có sẵn
     - Dữ liệu thật từ Prisma/PostgreSQL
     - Tính năng check-in/check-out thủ công
     - Thống kê thời gian thực

3. ✅ **Docker**:
   - Sửa lỗi reference `database` → `postgres`
   - Cấu hình adminer trỏ đến postgres

## 🚀 Hướng Dẫn Khởi Động

### Phương Án 1: Sử dụng Docker (Khuyến Nghị)

```bash
# 1. Đảm bảo Docker đang chạy

# 2. Khởi động toàn bộ hệ thống
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d --build
```

**Các dịch vụ sẽ chạy trên:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001 (mapped từ container port 5000)
- PostgreSQL: localhost:5432
- Prisma Studio: http://localhost:5555
- Adminer (optional): http://localhost:8080

### Phương Án 2: Chạy Local

#### Backend:

```bash
cd BE

# 1. Cài đặt dependencies
npm install

# 2. Tạo file .env (nếu chưa có)
# DATABASE_URL="postgresql://eparking_user:eparking_password_2024@localhost:5432/eParking_db?schema=public"

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Đồng bộ database schema
npm run prisma:db:push

# 5. Seed dữ liệu mẫu (optional)
npm run prisma:db:seed

# 6. Khởi động server
npm start
# hoặc development mode
npm run dev
```

#### Frontend:

```bash
cd FE

# 1. Cài đặt dependencies
npm install

# 2. Khởi động development server
npm start
```

## 🗄️ Quản Lý Database

### Sử dụng Prisma Studio:

```bash
cd BE
npm run prisma:studio
```

Truy cập: http://localhost:5555

### Sử dụng Adminer (khi chạy Docker):

Truy cập: http://localhost:8080

**Thông tin kết nối:**

- System: PostgreSQL
- Server: postgres (hoặc localhost nếu chạy local)
- Username: eparking_user
- Password: eparking_password_2024
- Database: eParking_db

## 📊 Cấu Trúc API Endpoints

### Authentication:

- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `GET /api/users/:userId` - Lấy thông tin user

### Vehicles:

- `GET /api/users/:userId/vehicles` - Danh sách xe của user
- `POST /api/vehicles` - Đăng ký xe mới
- `PUT /api/vehicles/:vehicleId` - Cập nhật xe
- `DELETE /api/vehicles/:vehicleId` - Xóa xe

### Parking Sessions:

- `GET /api/parking-history/:vehicle_id` - Lịch sử gửi xe
- `POST /api/parking-sessions/check-in` - Check-in xe
- `POST /api/parking-sessions/check-out` - Check-out xe

### Parking Lots:

- `GET /api/parking-lots` - Danh sách bãi xe
- `GET /api/parking-lots/overview` - Tổng quan bãi xe (có số chỗ đã sử dụng)
- `PUT /api/parking-lots/:lotId` - Cập nhật bãi xe

### Admin Management:

- `GET /api/admin/stats` - Thống kê tổng quan
- `GET /api/admin/users` - Danh sách người dùng
- `GET /api/admin/vehicles` - Danh sách phương tiện
- `GET /api/admin/parking-sessions/active` - Phiên gửi xe đang hoạt động
- `PUT /api/admin/users/:userId/balance` - Cập nhật số dư user

### Activities & Monitoring:

- `GET /api/activities/recent` - Hoạt động gần đây
- `GET /api/cameras` - Danh sách camera
- `PUT /api/cameras/:cameraId` - Cập nhật camera
- `GET /api/alerts` - Cảnh báo hệ thống
- `GET /api/logs` - System logs

### Wallet & Transactions:

- `GET /api/wallet/:userId` - Thông tin ví
- `POST /api/wallet/topup` - Nạp tiền
- `GET /api/transactions` - Lịch sử giao dịch

### Dashboard:

- `GET /api/dashboard/stats` - Thống kê dashboard

## 🔧 Troubleshooting

### Lỗi kết nối database:

```bash
# Kiểm tra PostgreSQL đang chạy
docker-compose ps

# Xem logs
docker-compose logs postgres

# Reset database (Cẩn thận: Mất hết dữ liệu!)
docker-compose down -v
docker-compose up --build
```

### Lỗi Prisma Client:

```bash
cd BE
npm run prisma:generate
npm run prisma:db:push
```

### Port đã được sử dụng:

Sửa file `docker-compose.yml` hoặc `.env` để thay đổi port:

```
FRONTEND_PORT=3001
BACKEND_PORT=5002
DB_PORT=5433
```

## 📝 Thông Tin Đăng Nhập Mặc Định

Sau khi seed database, bạn có thể đăng nhập với:

**Admin:**

- Email: admin@dlu.edu.vn
- Password: admin123

**Student:**

- Email: student@dlu.edu.vn
- Password: student123

## ⚠️ Lưu Ý Quan Trọng

1. **Không còn hỗ trợ MySQL** - Hệ thống chỉ sử dụng PostgreSQL
2. **Admin không có trang chủ** - Tự động redirect tới Dashboard
3. **Trang "Quản lý trực tiếp"**:

   - Phải chọn camera từ dropdown trước khi xem live
   - Tất cả dữ liệu đều real-time từ database
   - Hỗ trợ check-in/check-out thủ công

4. **API Changes**:
   - Tất cả API đã được cập nhật để sử dụng Prisma
   - Payment status sử dụng enum: `Chua_thanh_toan`, `Da_thanh_toan`, `Hoan_tien`
   - Session status: `IN`, `OUT`

## 🔄 Cập Nhật Code Mới Nhất

```bash
# Pull code mới
git pull origin main

# Rebuild Docker
docker-compose down
docker-compose up --build

# Hoặc nếu chạy local
cd BE
npm install
npm run prisma:generate
npm run prisma:db:push
npm start

cd ../FE
npm install
npm start
```

## 📚 Tài Liệu Thêm

- Prisma Documentation: https://www.prisma.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Docker Compose: https://docs.docker.com/compose/

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs: `docker-compose logs`
2. Kiểm tra database connection
3. Đảm bảo tất cả dependencies đã được cài đặt
4. Reset lại hệ thống: `docker-compose down -v && docker-compose up --build`
