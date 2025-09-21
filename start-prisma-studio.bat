@echo off
echo 🚀 eParking System với Prisma Studio
echo ======================================

echo 📝 Khởi chạy tất cả services bao gồm Prisma Studio...
docker-compose up -d

echo ⏳ Đợi services khởi động...
timeout /t 30 /nobreak

echo 📊 Kiểm tra trạng thái containers:
docker-compose ps

echo.
echo 🎉 Khởi chạy hoàn tất!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔗 Backend API: http://localhost:5001
echo 🗄️ Prisma Studio: http://localhost:5555
echo 🛠️ Adminer (optional): docker-compose --profile tools up -d adminer
echo                         http://localhost:8080
echo.
echo 💡 Để xem logs realtime: docker-compose logs -f [service_name]
echo 💡 Để dừng: docker-compose down
pause