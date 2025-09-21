# 🐳 Hướng dẫn Docker cho eParking System

## 📋 Tóm tắt

Setup Docker hoàn chình cho hệ thống eParking bao gồm:

- ✅ Backend Node.js với MySQL
- ✅ Frontend React với Nginx
- ✅ Database MySQL 8.0 với schema đầy đủ
- ✅ Development & Production environments
- ✅ Health checks và monitoring
- ✅ Security best practices

## 🚀 Khởi chạy nhanh

### Windows

```bash
# Chạy script tự động
start.bat

# Hoặc sử dụng Docker Compose trực tiếp
docker-compose up -d
```

### Linux/MacOS

```bash
# Chạy script tự động
./start.sh

# Hoặc sử dụng Makefile
make install
```

## 📁 Các file đã tạo

### Root Directory

- `docker-compose.yml` - Main orchestration
- `docker-compose.dev.yml` - Development overrides
- `.env.example` - Environment template
- `Makefile` - Command shortcuts
- `start.sh` / `start.bat` - Auto setup scripts
- `README-Docker.md` - Detailed documentation

### Backend (BE/)

- `Dockerfile` - Production container
- `Dockerfile.dev` - Development container
- `schema-mysql.sql` - MySQL schema (converted from SQL Server)
- `.dockerignore` - Build exclusions
- Updated `package.json` với Docker scripts

### Frontend (FE/)

- `Dockerfile` - Production container với Nginx
- `Dockerfile.dev` - Development container
- `nginx.conf` - Nginx configuration
- `.dockerignore` - Build exclusions
- Updated `package.json` với Docker scripts

## 🔧 Environment Variables

File `.env` chứa các cấu hình:

```env
# Database
DB_USER=eparking_user
DB_PASSWORD=eparking_password_2024
DB_DATABASE_NAME=eParking_db

# Services
FRONTEND_PORT=3000
BACKEND_PORT=5000
ADMINER_PORT=8080

# API URL
REACT_APP_API_URL=http://localhost:5000
```

## 🛠️ Commands có sẵn

### Docker Compose Commands

```bash
docker-compose up -d          # Khởi chạy production
docker-compose down           # Dừng tất cả
docker-compose logs -f        # Xem logs
docker-compose ps             # Kiểm tra status
```

### Makefile Commands (Linux/MacOS)

```bash
make help                     # Xem tất cả commands
make up                       # Khởi chạy
make dev                      # Development mode
make logs                     # Xem logs
make clean                    # Clean up
```

### Package.json Scripts

```bash
# Backend
npm run docker:build         # Build backend image
npm run docker:dev           # Run development
npm run db:init:docker        # Initialize database

# Frontend
npm run docker:build         # Build frontend image
npm run docker:dev           # Run development
```

## 🔍 Services & Ports

| Service  | Port | URL                   | Description    |
| -------- | ---- | --------------------- | -------------- |
| Frontend | 3000 | http://localhost:3000 | React app      |
| Backend  | 5000 | http://localhost:5000 | API server     |
| Database | 3306 | localhost:3306        | MySQL database |
| Adminer  | 8080 | http://localhost:8080 | Database admin |

## 📊 Health Checks

Tất cả services có health checks:

- Backend: `GET /api/health`
- Frontend: Nginx status check
- Database: MySQL ping check

## 🔐 Demo Accounts

- **Admin**: `admin@dlu.edu.vn` / `123456`
- **Student**: `hocquang@student.dlu.edu.vn` / `123456`

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**:

   ```bash
   # Change ports in .env file
   FRONTEND_PORT=3001
   BACKEND_PORT=5001
   ```

2. **Database connection failed**:

   ```bash
   docker-compose logs database
   docker-compose restart database
   ```

3. **Schema not loaded**:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Reset Everything

```bash
# Full reset
docker-compose down -v --remove-orphans
docker system prune -f
docker-compose up --build -d
```

## 📈 Next Steps

1. ✅ Docker setup hoàn thành
2. ⏳ Production deployment (cần SSL, domain, etc.)
3. ⏳ CI/CD pipeline setup
4. ⏳ Monitoring & logging setup
5. ⏳ Backup strategies

## 💡 Tips

- Sử dụng `make dev` cho development với live reload
- Database data được persist trong Docker volumes
- Logs có thể xem bằng `docker-compose logs -f [service]`
- Health checks giúp đảm bảo services ready trước khi start dependent services

**✅ Setup Docker hoàn tất! Hệ thống sẵn sàng sử dụng.**
