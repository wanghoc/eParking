# 🚀 eParking Docker Setup - HOÀN THÀNH

## ✅ **Setup thành công các services:**

### 🐳 **Docker Services**

| Service                  | Container                | Port | Status     | URL                   |
| ------------------------ | ------------------------ | ---- | ---------- | --------------------- |
| **PostgreSQL Database**  | `eparking_db`            | 5432 | ✅ Healthy | Internal only         |
| **Backend API (Prisma)** | `eparking_backend`       | 5001 | ✅ Healthy | http://localhost:5001 |
| **Frontend React**       | `eparking_frontend`      | 3000 | ✅ Running | http://localhost:3000 |
| **Prisma Studio**        | `eparking_prisma_studio` | 5555 | ✅ Running | http://localhost:5555 |
| **Adminer**              | `eparking_adminer`       | 8080 | ✅ Running | http://localhost:8080 |

### 🗄️ **Database thông tin:**

- **Type**: PostgreSQL 15
- **Name**: eParking_db
- **User**: eparking_user
- **Password**: eparking_password_2024
- **Prisma Schema**: ✅ Pushed successfully
- **Demo Data**: ✅ Seeded with users, vehicles, parking lots, etc.

### 📊 **Demo Data đã được seed:**

- **4 Users**: 1 Admin + 3 Students với wallets
- **3 Vehicles**: Honda Wave, Yamaha Exciter, Honda Winner
- **2 Parking Lots**: Bãi xe A (50 slots), Bãi xe B (40 slots)
- **4 Cameras**: A1, A2, B1, B2 với trạng thái khác nhau
- **Payment Methods**: MoMo, VNPay, ZaloPay
- **System Settings**: Fees, thresholds, v.v.

## 🚀 **Cách sử dụng:**

### **Option 1: Script tự động (Recommended)**

```cmd
# Chạy script khởi chạy toàn bộ
start-prisma-studio.bat
```

### **Option 2: Manual Commands**

```cmd
# Khởi chạy tất cả services
docker-compose up -d

# Chỉ khởi chạy core services (không bao gồm adminer)
docker-compose up -d database backend frontend prisma-studio

# Khởi chạy thêm adminer (optional)
docker-compose --profile tools up -d adminer

# Xem logs
docker-compose logs -f [service_name]

# Dừng tất cả
docker-compose down

# Xóa data và restart từ đầu
docker-compose down -v
docker-compose up -d
```

## 🔐 **Demo Accounts:**

```bash
# Admin Account
Email: admin@dlu.edu.vn
Password: 123456
Role: admin

# Student Accounts
Email: hocquang@student.dlu.edu.vn
Password: 123456
MSSV: 2212375

Email: nguyenvana@student.dlu.edu.vn
Password: 123456
MSSV: 2212376

Email: tranthib@student.dlu.edu.vn
Password: 123456
MSSV: 2212377 (Status: inactive)
```

## 🛠️ **Development Tools:**

### **Prisma Studio - Database Management**

- **URL**: http://localhost:5555
- **Features**:
  - ✅ Browse all tables and data
  - ✅ Edit records directly
  - ✅ Real-time data visualization
  - ✅ Relationship navigation
  - ✅ Query builder interface

### **Adminer - Advanced Database Admin**

- **URL**: http://localhost:8080
- **Login**:
  - System: PostgreSQL
  - Server: database
  - Username: eparking_user
  - Password: eparking_password_2024
  - Database: eParking_db

## 📋 **API Endpoints kiểm tra:**

```bash
# Health Check
GET http://localhost:5001/api/health
Response: {"ok":true,"ts":"..."}

# Users (cần authentication)
GET http://localhost:5001/api/users

# Vehicles
GET http://localhost:5001/api/vehicles

# Parking Sessions
GET http://localhost:5001/api/parking-sessions

# Cameras
GET http://localhost:5001/api/cameras
```

## 🔧 **Troubleshooting:**

### **Container không start**

```bash
# Check logs
docker-compose logs [service_name]

# Restart specific service
docker-compose restart [service_name]

# Rebuild if needed
docker-compose up --build -d [service_name]
```

### **Database connection issues**

```bash
# Check database is healthy
docker-compose ps database

# Reset database completely
docker-compose down -v
docker volume prune -f
docker-compose up -d
```

### **Prisma Studio không load được**

```bash
# Check Prisma Studio logs
docker-compose logs prisma-studio

# Restart Prisma Studio
docker-compose restart prisma-studio

# Manual access
docker-compose exec prisma-studio npx prisma studio --port 5555 --hostname 0.0.0.0
```

### **Port conflicts**

```bash
# Check what's using ports
netstat -an | findstr :5555
netstat -an | findstr :5001
netstat -an | findstr :3000

# Change ports in .env file if needed
```

## 📈 **Performance Monitoring:**

```bash
# View resource usage
docker stats

# Container health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Database size and performance
docker-compose exec database psql -U eparking_user -d eParking_db -c "
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE schemaname = 'public';"
```

## 🎯 **Key Features đã implement:**

### **✅ Backend (Node.js + Prisma)**

- RESTful API endpoints
- PostgreSQL database với Prisma ORM
- Type-safe database operations
- Auto schema migrations
- Seeded demo data
- Health check endpoints

### **✅ Frontend (React)**

- Modern React application
- Responsive UI design
- Docker-optimized build
- Nginx serving static files

### **✅ Database (PostgreSQL)**

- Persistent data volumes
- Health checks
- Auto-initialization
- Connection pooling ready

### **✅ Development Tools**

- Prisma Studio tích hợp
- Adminer cho advanced operations
- Hot reload trong development
- Comprehensive logging

## 🚀 **Next Steps:**

1. **Authentication**: Implement JWT authentication
2. **Authorization**: Role-based access control
3. **Real-time**: WebSocket cho parking status
4. **Camera Integration**: Connect actual camera feeds
5. **Payment**: Integrate payment gateways
6. **Mobile**: React Native mobile app
7. **Monitoring**: Add Prometheus + Grafana
8. **CI/CD**: GitHub Actions deployment

---

**✅ Setup hoàn tất! eParking system với PostgreSQL + Prisma + Docker sẵn sàng sử dụng.**

**🔗 Quick Access:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Prisma Studio: http://localhost:5555
- Adminer: http://localhost:8080
