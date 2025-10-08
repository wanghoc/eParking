# 🚀 Hướng Dẫn Khởi Động Nhanh - eParking System

## ✅ Hệ Thống Đã Sẵn Sàng!

Hệ thống eParking đã được khởi động thành công với Docker!

---

## 📍 Các Địa Chỉ Truy Cập

### 🌐 Frontend (Website)

**URL:** http://localhost:3000

**Thông tin đăng nhập:**

- **Admin:**
  - Email: `admin@dlu.edu.vn`
  - Password: `admin123`
- **Student:**
  - Email: `student@dlu.edu.vn`
  - Password: `student123`

### 🔌 Backend API

**URL:** http://localhost:5001/api

**Test API:**

```bash
# Health check
curl http://localhost:5001/api/health

# Login
curl -X POST http://localhost:5001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dlu.edu.vn","password":"admin123"}'
```

### 🗄️ Prisma Studio (Database Management)

**URL:** http://localhost:5555

**Tính năng:**

- Xem và chỉnh sửa data trực tiếp
- Tạo/sửa/xóa records
- Query builder
- Real-time updates

### 🐘 PostgreSQL Database

**Host:** localhost  
**Port:** 3306 (mapped từ 5432)  
**Database:** eParking_db  
**Username:** eparking_user  
**Password:** eparking_password_2024

---

## 🎯 Tính Năng Chính Đã Hoàn Thiện

### 👤 Cho Student:

1. ✅ **Trang chủ** - Dashboard với thống kê cá nhân
2. ✅ **Quản lý phương tiện** - Đăng ký/sửa/xóa xe
3. ✅ **Lịch sử gửi xe** - Xem chi tiết các lần gửi xe
4. ✅ **Nạp tiền** - Nạp tiền vào ví qua nhiều phương thức
5. ✅ **FAQ** - Câu hỏi thường gặp

### 🛡️ Cho Admin:

1. ✅ **Giám sát trực tiếp** - Dashboard tổng quan hệ thống
2. ✅ **Quản lý trực tiếp** - Quản lý bãi xe real-time với:
   - Chọn camera từ dropdown
   - Xem camera live
   - Check-in/check-out thủ công
   - Thống kê thời gian thực
   - Hoạt động gần đây
3. ✅ **Quản lý camera** - Cấu hình và theo dõi camera
4. ✅ **Quản trị hệ thống** - Quản lý user, xe, số dư
5. ✅ **Lịch sử** - Xem lịch sử toàn hệ thống

---

## 🧪 Test Hệ Thống

### Bước 1: Đăng nhập Admin

1. Truy cập: http://localhost:3000
2. Đăng nhập với admin account
3. Kiểm tra redirect tới Dashboard (không có trang chủ)

### Bước 2: Test Quản Lý Trực Tiếp

1. Click menu "Quản lý trực tiếp"
2. Chọn camera từ dropdown
3. Click "Xem camera" để xem live
4. Test check-in thủ công:
   - Click "Nhập xe thủ công"
   - Nhập biển số: `49P1-12345`
   - Chọn bãi xe
   - Submit

### Bước 3: Test Quản Trị Hệ Thống

1. Click menu "Quản trị hệ thống"
2. Xem danh sách users
3. Xem danh sách vehicles
4. Test chỉnh sửa số dư user (password admin: `admin123`)

### Bước 4: Test Student Account

1. Logout và đăng nhập với student account
2. Test đăng ký phương tiện
3. Test nạp tiền
4. Xem lịch sử gửi xe

---

## 🐳 Quản Lý Docker Containers

### Xem trạng thái containers:

```bash
docker-compose ps
```

### Xem logs:

```bash
# All containers
docker-compose logs

# Specific container
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Restart containers:

```bash
# Restart tất cả
docker-compose restart

# Restart specific
docker-compose restart backend
```

### Stop hệ thống:

```bash
docker-compose down
```

### Rebuild và start lại:

```bash
docker-compose down
docker-compose up -d --build
```

---

## 🔧 Sửa Lỗi Thường Gặp

### Lỗi: Port đã được sử dụng

**Giải pháp:** Thay đổi port trong file `.env`:

```
FRONTEND_PORT=3001
BACKEND_PORT=5002
```

### Lỗi: Cannot connect to database

**Giải pháp:**

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Lỗi: Prisma Client not generated

**Giải pháp:**

```bash
# Vào container backend
docker-compose exec backend sh

# Generate Prisma Client
npx prisma generate

# Exit
exit
```

### Frontend không load

**Giải pháp:**

```bash
# Clear và rebuild
docker-compose down
docker-compose up -d --build frontend
```

---

## 📊 Kiểm Tra Database

### Sử dụng Prisma Studio (Khuyến nghị):

1. Truy cập: http://localhost:5555
2. Click vào bảng (Users, Vehicles, ParkingSessions, etc.)
3. Xem/chỉnh sửa data

### Sử dụng psql:

```bash
# Vào PostgreSQL container
docker-compose exec postgres psql -U eparking_user -d eParking_db

# Xem tables
\dt

# Xem users
SELECT * FROM users;

# Exit
\q
```

---

## 📝 API Endpoints Quan Trọng

### Authentication:

- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `GET /api/users/:userId` - Thông tin user

### Management (Admin):

- `GET /api/parking-lots/overview` - Tổng quan bãi xe
- `GET /api/activities/recent` - Hoạt động gần đây
- `GET /api/cameras` - Danh sách camera
- `POST /api/parking-sessions/check-in` - Check-in thủ công
- `POST /api/parking-sessions/check-out` - Check-out thủ công

### Dashboard:

- `GET /api/admin/stats` - Thống kê tổng quan
- `GET /api/dashboard/stats` - Thống kê cá nhân

---

## ✨ Những Điểm Mới

1. **Hoàn toàn PostgreSQL + Prisma** - Không còn MySQL
2. **Admin không có Home** - Tự động redirect tới Dashboard
3. **Quản lý trực tiếp hoàn chỉnh:**

   - Camera selector với dữ liệu thật
   - Check-in/out thủ công
   - Stats thời gian thực
   - Hoạt động gần đây từ database

4. **50+ API endpoints** - Đầy đủ chức năng
5. **Type-safe** - Prisma ORM với TypeScript
6. **Docker ready** - Production-ready configuration

---

## 🆘 Cần Hỗ Trợ?

### Check logs khi có lỗi:

```bash
docker-compose logs --tail=50
```

### Reset hoàn toàn (Cẩn thận - Mất data!):

```bash
docker-compose down -v
docker-compose up -d --build
```

### Backup database:

```bash
docker-compose exec postgres pg_dump -U eparking_user eParking_db > backup.sql
```

---

## 🎉 Hệ Thống Sẵn Sàng!

Mọi thứ đã được setup và chạy ổn định. Bạn có thể:

1. ✅ Đăng nhập và test các tính năng
2. ✅ Xem database qua Prisma Studio
3. ✅ Test API qua curl hoặc Postman
4. ✅ Deploy production khi sẵn sàng

**Happy coding!** 🚀
