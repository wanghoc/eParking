# 🚀 Hướng dẫn chạy dự án eParking không cần Docker

## 📋 Yêu cầu hệ thống

### **Backend (Node.js)**

- **Node.js**: v18+ (khuyến nghị v18.17.0+)
- **npm**: v8+ hoặc **yarn**: v1.22+
- **PostgreSQL**: v12+ (khuyến nghị v14+)
- **Git**: Để clone repository

### **Frontend (React)**

- **Node.js**: v18+ (khuyến nghị v18.17.0+)
- **npm**: v8+ hoặc **yarn**: v1.22+

## 🛠️ Cài đặt môi trường

### **1. Cài đặt Node.js**

```bash
# Windows (sử dụng Chocolatey)
choco install nodejs

# Hoặc tải từ: https://nodejs.org/
# Chọn phiên bản LTS (Long Term Support)

# Kiểm tra cài đặt
node --version
npm --version
```

### **2. Cài đặt PostgreSQL**

#### **Windows:**

```bash
# Sử dụng Chocolatey
choco install postgresql

# Hoặc tải từ: https://www.postgresql.org/download/windows/
```

#### **macOS:**

```bash
# Sử dụng Homebrew
brew install postgresql
brew services start postgresql
```

#### **Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **3. Thiết lập Database**

```bash
# Tạo user và database
sudo -u postgres psql

# Trong PostgreSQL shell:
CREATE USER eparking_user WITH PASSWORD 'eparking_password_2024';
CREATE DATABASE eParking_db OWNER eparking_user;
GRANT ALL PRIVILEGES ON DATABASE eParking_db TO eparking_user;
\q
```

## 📁 Chuẩn bị dự án

### **1. Clone repository**

```bash
git clone <repository-url>
cd eParkig
```

### **2. Tạo file .env**

```bash
# Tạo file .env trong thư mục gốc
touch .env
```

**Nội dung file .env:**

```env
# Database Configuration
DB_HOST=localhost
DB_USER=eparking_user
DB_PASSWORD=eparking_password_2024
DB_DATABASE_NAME=eParking_db
DB_PORT=5432
DATABASE_URL="postgresql://eparking_user:eparking_password_2024@localhost:5432/eParking_db?schema=public"

# Backend Configuration
NODE_ENV=development
PORT=5000
USE_PRISMA=true

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

## 🔧 Cài đặt Backend

### **1. Cài đặt dependencies**

```bash
cd BE
npm install
```

### **2. Thiết lập Prisma**

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database (tùy chọn)
npm run prisma:db:seed
```

### **3. Khởi chạy Backend**

```bash
# Development mode (với hot reload)
npm run dev

# Production mode
npm start
```

**Backend sẽ chạy tại:** `http://localhost:5000`

## 🎨 Cài đặt Frontend

### **1. Cài đặt dependencies**

```bash
cd FE
npm install
```

### **2. Khởi chạy Frontend**

```bash
# Development mode (với hot reload)
npm start

# Production build
npm run build
npm run build:prod
```

**Frontend sẽ chạy tại:** `http://localhost:3000`

## 🚀 Scripts tiện ích

### **Backend Scripts**

```bash
cd BE

# Development với nodemon
npm run dev

# Production
npm start

# Prisma commands
npm run prisma:generate    # Generate Prisma client
npm run prisma:db:push     # Push schema to database
npm run prisma:db:seed     # Seed database
npm run prisma:studio      # Open Prisma Studio
```

### **Frontend Scripts**

```bash
cd FE

# Development
npm start

# Build for production
npm run build
npm run build:prod

# Test
npm test

# Lint
npm run lint
```

## 🔍 Kiểm tra kết nối

### **1. Test Backend API**

```bash
# Health check
curl http://localhost:5000/api/health

# Hoặc mở browser: http://localhost:5000/api/health
```

### **2. Test Frontend**

```bash
# Mở browser: http://localhost:3000
```

### **3. Test Database**

```bash
# Kết nối PostgreSQL
psql -h localhost -U eparking_user -d eParking_db

# Kiểm tra tables
\dt

# Thoát
\q
```

## 📊 Quản lý Database

### **Prisma Studio**

```bash
cd BE
npx prisma studio
```

**Mở tại:** `http://localhost:5555`

### **Database Commands**

```bash
cd BE

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy

# Status
npx prisma migrate status
```

## 🐛 Troubleshooting

### **Lỗi thường gặp:**

#### **1. Port đã được sử dụng**

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### **2. Database connection failed**

```bash
# Kiểm tra PostgreSQL service
# Windows
sc query postgresql-x64-14

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

#### **3. Node modules issues**

```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### **4. Prisma issues**

```bash
cd BE
npx prisma generate --force
npx prisma db push --force-reset
```

## 🔄 Workflow Development

### **1. Khởi động đầy đủ**

```bash
# Terminal 1 - Database (nếu cần)
sudo systemctl start postgresql

# Terminal 2 - Backend
cd BE
npm run dev

# Terminal 3 - Frontend
cd FE
npm start
```

### **2. Development workflow**

1. **Backend**: Sửa code → Tự động reload
2. **Frontend**: Sửa code → Tự động reload
3. **Database**: Sử dụng Prisma Studio để quản lý

### **3. Production deployment**

```bash
# Backend
cd BE
npm run build
npm start

# Frontend
cd FE
npm run build:prod
# Serve static files với nginx hoặc serve
```

## 📝 Ghi chú quan trọng

- **Backend** chạy trên port **5000**
- **Frontend** chạy trên port **3000**
- **Database** chạy trên port **5432** (PostgreSQL default)
- **Prisma Studio** chạy trên port **5555**
- Đảm bảo tất cả ports không bị conflict
- File `.env` phải có đúng cấu hình database
- Chạy `npx prisma generate` sau khi thay đổi schema

## 🆘 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:

1. **Logs** của từng service
2. **Network connectivity** giữa FE và BE
3. **Database connection**
4. **Environment variables**
5. **Port conflicts**

---

**Chúc bạn thành công! 🎉**
