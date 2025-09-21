@echo off
echo 🚀 eParking Prisma Docker Setup
echo =================================

echo 📝 Tạo file .env với cấu hình Prisma...
(
echo # Environment Configuration for eParking System - Prisma Mode
echo.
echo # Node.js Environment
echo NODE_ENV=production
echo.
echo # Database Configuration
echo DB_HOST=database
echo DB_USER=eparking_user
echo DB_PASSWORD=eparking_password_2024
echo DB_ROOT_PASSWORD=eparking_root_2024
echo DB_DATABASE_NAME=eParking_db
echo DB_PORT=5432
echo.
echo # Prisma Configuration - PostgreSQL
echo DATABASE_URL=postgresql://eparking_user:eparking_password_2024@database:5432/eParking_db?schema=public
echo USE_PRISMA=true
echo.
echo # Backend Configuration
echo BACKEND_PORT=5000
echo.
echo # Frontend Configuration
echo FRONTEND_PORT=3000
echo REACT_APP_API_URL=http://localhost:5001
echo REACT_APP_ENVIRONMENT=production
echo.
echo # Adminer Configuration
echo ADMINER_PORT=8080
) > .env

echo ✅ File .env đã được tạo với Prisma enabled

echo 🗑️ Dọn dẹp containers và volumes cũ...
docker-compose down -v
docker volume prune -f

echo 🔧 Build và khởi chạy với Prisma...
docker-compose up --build -d

echo ⏳ Đợi containers khởi động...
timeout /t 30 /nobreak

echo 📊 Kiểm tra trạng thái containers:
docker-compose ps

echo 📝 Xem logs backend:
docker-compose logs --tail=20 backend

echo.
echo 🎉 Setup hoàn tất!
echo 📱 Frontend: http://localhost:3000
echo 🔗 Backend API: http://localhost:5001
echo 🗄️ Database Admin: http://localhost:8080
echo.
echo 💡 Để xem logs realtime: docker-compose logs -f backend
pause
