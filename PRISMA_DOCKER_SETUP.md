# 🚀 Prisma Docker Setup Guide

## ✅ Những gì đã được cấu hình:

### 🔧 **Docker Configuration**

- **USE_PRISMA=true** mặc định trong docker-compose.yml
- **Database**: Không còn load schema-mysql.sql (Prisma sẽ tự tạo)
- **Backend**: Tự động chạy `server-prisma.js` khi USE_PRISMA=true
- **Auto Setup**: Prisma db push + seed data tự động

### 📝 **Environment Variables (.env)**

```bash
USE_PRISMA=true                    # Enable Prisma mode
DATABASE_URL=mysql://...           # Prisma connection string
```

### 🐳 **Docker Flow**

```bash
1. Database starts (empty MySQL)
2. Backend waits for database healthy
3. Prisma db push (creates tables from schema.prisma)
4. Prisma db seed (inserts demo data)
5. Backend starts with Prisma ORM
```

## 🚀 **Setup Steps:**

### **Option 1: Auto Script (Recommended)**

```cmd
# Chạy script tự động
setup-prisma-docker.bat
```

### **Option 2: Manual Steps**

```cmd
# 1. Tạo .env với Prisma config
copy .env.example .env
# Edit .env: set USE_PRISMA=true

# 2. Xóa data cũ và restart
docker-compose down -v
docker volume prune -f

# 3. Build và start với Prisma
docker-compose up --build -d

# 4. Kiểm tra logs
docker-compose logs -f backend
```

## 📊 **Kiểm tra Setup thành công:**

### **1. Container Status**

```cmd
docker-compose ps
# Tất cả containers status = healthy
```

### **2. Backend Logs**

```cmd
docker-compose logs backend
# Thấy: "Starting eParking Backend with Prisma ORM"
# Thấy: "Prisma schema pushed successfully"
# Thấy: "Database seeded successfully"
```

### **3. API Test**

```cmd
curl http://localhost:5001/api/health
# Response: {"ok":true,"ts":"..."}
```

### **4. Database Test**

```cmd
# Vào Adminer: http://localhost:8080
# Login: eparking_user / eparking_password_2024
# Thấy tables được tạo bởi Prisma
```

## 🔍 **Prisma vs Legacy Mode:**

| Feature        | Legacy Mode      | Prisma Mode          |
| -------------- | ---------------- | -------------------- |
| Database Setup | schema-mysql.sql | Prisma schema.prisma |
| ORM            | Raw SQL queries  | Prisma Client        |
| Type Safety    | ❌               | ✅                   |
| Migrations     | Manual SQL       | Prisma migrations    |
| Seeding        | Manual INSERT    | Prisma seed script   |
| Dev Tools      | None             | Prisma Studio        |

## 🎯 **Demo Data sau khi setup:**

```javascript
// Users
- admin@dlu.edu.vn (Admin role)
- hocquang@student.dlu.edu.vn (Student)
- nguyenvana@student.dlu.edu.vn (Student)
- tranthib@student.dlu.edu.vn (Student - inactive)

// Vehicles
- 49P1-12345 (Honda Wave Alpha)
- 49P2-67890 (Yamaha Exciter 150)
- 49P3-54321 (Honda Winner X)

// Parking Lots
- Bãi xe A (50 slots)
- Bãi xe B (40 slots)

// Cameras
- Camera A1, A2, B1, B2 với status khác nhau
```

## 🛠️ **Useful Commands:**

```bash
# Xem logs realtime
docker-compose logs -f backend

# Restart chỉ backend
docker-compose restart backend

# Vào Prisma Studio (nếu muốn)
cd BE && npx prisma studio

# Reset database hoàn toàn
docker-compose down -v
docker-compose up -d

# Switch về Legacy mode
# Edit .env: USE_PRISMA=false
docker-compose restart backend
```

## 🚨 **Troubleshooting:**

### **Backend không start**

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Prisma schema có lỗi
# - Database connection failed
# - Seed data conflict
```

### **Database trống**

```bash
# Force recreate
docker-compose down -v
docker volume prune -f
docker-compose up --build -d
```

### **API không response**

```bash
# Check container health
docker-compose ps

# Check backend logs
docker-compose logs backend

# Test internal network
docker-compose exec frontend curl http://backend:5000/api/health
```

## 📈 **Performance & Monitoring:**

```bash
# View resource usage
docker stats

# Check container health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Database size
docker exec eparking_db mysql -u eparking_user -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='eParking_db';"
```

**✅ Setup hoàn tất! eParking với Prisma ORM sẵn sàng sử dụng.**
