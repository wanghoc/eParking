@echo off
rem eParking Docker Setup Script for Windows
rem Tự động setup và khởi chạy hệ thống eParking

setlocal enabledelayedexpansion

echo 🚀 eParking Docker Setup
echo ========================

rem Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker không được tìm thấy. Vui lòng cài đặt Docker Desktop trước.
    pause
    exit /b 1
)

rem Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose không được tìm thấy. Vui lòng cài đặt Docker Compose trước.
    pause
    exit /b 1
)

echo [SUCCESS] Docker và Docker Compose đã được cài đặt

rem Check if .env file exists, if not create from template
if not exist .env (
    echo [INFO] Tạo file .env từ template...
    if exist .env.example (
        copy .env.example .env >nul
        echo [SUCCESS] Đã tạo file .env từ .env.example
    ) else (
        echo [WARNING] Không tìm thấy file .env.example, tạo file .env mặc định...
        (
            echo # Environment Configuration for eParking System
            echo NODE_ENV=production
            echo DB_HOST=database
            echo DB_USER=eparking_user
            echo DB_PASSWORD=eparking_password_2024
            echo DB_ROOT_PASSWORD=eparking_root_2024
            echo DB_DATABASE_NAME=eParking_db
            echo DB_PORT=3306
            echo DB_DIALECT=mysql
            echo BACKEND_PORT=5000
            echo FRONTEND_PORT=3000
            echo REACT_APP_API_URL=http://localhost:5000
            echo REACT_APP_ENVIRONMENT=production
            echo ADMINER_PORT=8080
        ) > .env
        echo [SUCCESS] Đã tạo file .env mặc định
    )
) else (
    echo [INFO] File .env đã tồn tại
)

rem Stop any running containers
echo [INFO] Dừng các container đang chạy (nếu có)...
docker-compose down >nul 2>&1

rem Build and start services
echo [INFO] Building và khởi chạy services...
docker-compose up --build -d

rem Wait for services to be healthy
echo [INFO] Đợi services khởi động...
timeout /t 10 /nobreak >nul

rem Check service status
echo [INFO] Kiểm tra trạng thái services...
docker-compose ps

rem Display access information
echo.
echo [SUCCESS] 🎉 eParking đã khởi chạy thành công!
echo.
echo 📱 Frontend (React):     http://localhost:3000
echo 🔗 Backend API:          http://localhost:5000
echo 🔗 API Health Check:     http://localhost:5000/api/health
echo 🗄️  Database Admin:       http://localhost:8080
echo.
echo 🔐 Database Connection:
echo    Host: localhost
echo    Port: 3306
echo    User: eparking_user
echo    Password: eparking_password_2024
echo    Database: eParking_db
echo.
echo 👤 Demo Accounts:
echo    Admin: admin@dlu.edu.vn / 123456
echo    Student: hocquang@student.dlu.edu.vn / 123456
echo.
echo 🛠️  Useful commands:
echo    docker-compose logs -f     # Xem logs
echo    docker-compose down        # Dừng hệ thống
echo    docker-compose restart     # Restart hệ thống
echo.

rem Test API endpoint
echo [INFO] Testing API connection...
timeout /t 5 /nobreak >nul
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ⚠️  Backend API chưa sẵn sàng, có thể cần thêm thời gian
) else (
    echo [SUCCESS] ✅ Backend API đang hoạt động
)

echo.
echo [SUCCESS] Setup hoàn tất! 🚀
echo Nhấn Enter để mở browser...
pause >nul

rem Open browser
start http://localhost:3000
