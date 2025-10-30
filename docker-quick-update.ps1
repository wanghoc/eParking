# eParking - Quick Docker Update Script
# Rebuilds backend with ML support and restarts all services

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  eParking - Docker Update với ML" -ForegroundColor Cyan  
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Stop containers
Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Rebuild backend only (faster)
Write-Host ""
Write-Host "🔨 Rebuilding backend với ML dependencies..." -ForegroundColor Yellow
Write-Host "   (Quá trình này có thể mất 3-5 phút)" -ForegroundColor Gray
docker-compose build --no-cache backend

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Start all services
Write-Host ""
Write-Host "🚀 Starting all services..." -ForegroundColor Green
docker-compose up -d

# Wait for services
Write-Host ""
Write-Host "⏳ Waiting for services to start (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check status
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

# Test ML in backend
Write-Host ""
Write-Host "🧪 Testing ML libraries in backend..." -ForegroundColor Cyan

$test1 = docker exec eparking_backend python3 --version 2>&1
Write-Host "   Python: $test1" -ForegroundColor Gray

$test2 = docker exec eparking_backend python3 -c "import cv2; print(cv2.__version__)" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ OpenCV: $test2" -ForegroundColor Green
} else {
    Write-Host "   ❌ OpenCV: Not installed" -ForegroundColor Red
}

$test3 = docker exec eparking_backend python3 -c "import easyocr; print(easyocr.__version__)" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ EasyOCR: $test3" -ForegroundColor Green
} else {
    Write-Host "   ❌ EasyOCR: Not installed" -ForegroundColor Red
}

$test4 = docker exec eparking_backend python3 -c "from ultralytics import YOLO; print('OK')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Ultralytics (YOLO): OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ultralytics: Not installed" -ForegroundColor Red
}

# Check model file
Write-Host ""
$modelCheck = docker exec eparking_backend ls -lh ml_models/plate_detector/best.pt 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ML Model: Found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  ML Model: Not found - You need to copy it!" -ForegroundColor Yellow
    Write-Host "      Run: docker cp BE/ml_models/plate_detector/best.pt eparking_backend:/app/ml_models/plate_detector/best.pt" -ForegroundColor Gray
}

# Show recent logs
Write-Host ""
Write-Host "📝 Recent Backend Logs:" -ForegroundColor Cyan
docker-compose logs backend --tail=10

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Update Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Services:" -ForegroundColor White
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Prisma:    http://localhost:5555" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Next Steps:" -ForegroundColor White
Write-Host "   1. Truy cập http://localhost:3000" -ForegroundColor Gray
Write-Host "   2. Mở camera để test nhận diện biển số" -ForegroundColor Gray
Write-Host "   3. Xem logs: docker-compose logs -f backend" -ForegroundColor Gray
Write-Host ""
