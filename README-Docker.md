# eParking System - Docker Setup

## 📋 Tổng quan

Hệ thống eParking được containerized với Docker để dễ dàng triển khai và phát triển. Hệ thống bao gồm:

- **Frontend**: React TypeScript app với Nginx
- **Backend**: Node.js API server
- **Database**: MySQL 8.0
- **Tools**: Adminer cho quản lý database (tùy chọn)

## 🚀 Bắt đầu nhanh

### Điều kiện tiên quyết

- Docker Desktop hoặc Docker Engine
- Docker Compose v3.8+
- Port 3000, 5000, 3306, 8080 phải được trống

### Khởi chạy hệ thống

1. **Clone repository và di chuyển vào thư mục dự án:**

   ```bash
   cd eParkig
   ```

2. **Tạo file environment (nếu chưa có):**

   ```bash
   cp .env.example .env
   ```

3. **Khởi chạy tất cả services:**

   ```bash
   docker-compose up -d
   ```

4. **Kiểm tra trạng thái services:**

   ```bash
   docker-compose ps
   ```

5. **Truy cập ứng dụng:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Adminer (Database UI): http://localhost:8080

## 🛠️ Các lệnh Docker hữu ích

### Quản lý Docker Compose

```bash
# Khởi chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f backend

# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (xóa database data)
docker-compose down -v

# Rebuild và restart
docker-compose up --build -d

# Chạy chỉ một số services
docker-compose up -d database backend
```

### Quản lý Database

```bash
# Kết nối vào MySQL container
docker-compose exec database mysql -u eparking_user -p eParking_db

# Backup database
docker-compose exec database mysqldump -u eparking_user -p eParking_db > backup.sql

# Restore database
docker-compose exec -T database mysql -u eparking_user -p eParking_db < backup.sql

# Xem logs database
docker-compose logs -f database
```

### Development Commands

```bash
# Development mode với live reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Chạy backend development
npm run docker:dev --prefix BE

# Build riêng từng service
docker-compose build backend
docker-compose build frontend

# Restart một service
docker-compose restart backend
```

## 📁 Cấu trúc file Docker

```
eParkig/
├── docker-compose.yml          # Main orchestration file
├── .env.example               # Environment template
├── .env                       # Environment variables
├── README-Docker.md           # Docker documentation
├── BE/
│   ├── Dockerfile            # Backend container config
│   ├── .dockerignore         # Backend ignore rules
│   ├── schema-mysql.sql      # MySQL database schema
│   └── package.json          # Updated with Docker scripts
└── FE/
    ├── Dockerfile            # Frontend container config
    ├── .dockerignore         # Frontend ignore rules
    ├── nginx.conf            # Nginx configuration
    └── package.json          # Updated with Docker scripts
```

## ⚙️ Cấu hình Environment

File `.env` chứa các biến môi trường:

```bash
# Database
DB_USER=eparking_user
DB_PASSWORD=eparking_password_2024
DB_DATABASE_NAME=eParking_db

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=5000
ADMINER_PORT=8080

# API URL
REACT_APP_API_URL=http://localhost:5000
```

## 🔧 Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng:**

   ```bash
   # Kiểm tra port
   netstat -tulpn | grep :3000

   # Thay đổi port trong .env
   FRONTEND_PORT=3001
   ```

2. **Database connection failed:**

   ```bash
   # Kiểm tra logs
   docker-compose logs database

   # Restart database
   docker-compose restart database
   ```

3. **Frontend không kết nối được Backend:**

   ```bash
   # Kiểm tra network
   docker network ls
   docker network inspect eparking_network
   ```

4. **Schema không được load:**
   ```bash
   # Force recreate database
   docker-compose down -v
   docker-compose up -d
   ```

### Reset toàn bộ hệ thống

```bash
# Dừng và xóa tất cả
docker-compose down -v --remove-orphans

# Xóa images (nếu cần)
docker rmi eparking_backend eparking_frontend

# Khởi chạy lại từ đầu
docker-compose up --build -d
```

## 📊 Monitoring & Health Checks

Tất cả services đều có health checks:

```bash
# Kiểm tra health status
docker-compose ps

# Xem chi tiết health check
docker inspect eparking_backend --format='{{.State.Health.Status}}'
```

## 🔐 Security Notes

- Database password được set trong environment variables
- Non-root users được sử dụng trong containers
- Security headers được set trong Nginx
- Sensitive files được exclude trong .dockerignore

## 🎯 Production Deployment

Cho production, cần:

1. Thay đổi passwords mạnh hơn
2. Sử dụng external database
3. Setup SSL/TLS
4. Configure logging
5. Set up monitoring

```bash
# Production environment
NODE_ENV=production docker-compose up -d
```

## 📞 Hỗ trợ

- Tài khoản test: `admin@dlu.edu.vn` / password: `123456`
- Database: MySQL 8.0 với schema đầy đủ
- API Documentation: http://localhost:5000/api/health
