# Quick Start - WebSocket Realtime Detection
# Hướng dẫn test nhanh hệ thống

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 eParking WebSocket Detection - Quick Start" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop old containers
Write-Host "[Step 1/5] 🛑 Stopping old containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans
Write-Host "✅ Old containers stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Build services
Write-Host "[Step 2/5] 🔨 Building services with WebSocket support..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray
docker-compose build --no-cache backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Start services
Write-Host "[Step 3/5] 🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 10
Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Step 4: Check health
Write-Host "[Step 4/5] 🏥 Checking service health..." -ForegroundColor Yellow

Write-Host "   Checking Backend API (Port 5000)..." -ForegroundColor Gray
$backend_health = $null
for ($i = 1; $i -le 30; $i++) {
    try {
        $backend_health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -ErrorAction SilentlyContinue
        if ($backend_health) {
            Write-Host "   ✅ Backend API: Healthy" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "   ⏳ Waiting for backend... ($i/30)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backend_health) {
    Write-Host "   ❌ Backend API: Not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs: docker logs eparking_backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "   Checking WebSocket Detector (Port 5001)..." -ForegroundColor Gray
$ws_health = $null
for ($i = 1; $i -le 30; $i++) {
    try {
        $ws_health = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get -ErrorAction SilentlyContinue
        if ($ws_health) {
            Write-Host "   ✅ WebSocket Detector: Healthy" -ForegroundColor Green
            Write-Host "   📊 Stats:" -ForegroundColor Cyan
            Write-Host "      - Status: $($ws_health.status)" -ForegroundColor Gray
            Write-Host "      - Detector: $($ws_health.detector)" -ForegroundColor Gray
            break
        }
    } catch {
        Write-Host "   ⏳ Waiting for WebSocket detector... ($i/30)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ws_health) {
    Write-Host "   ❌ WebSocket Detector: Not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs: docker logs eparking_backend | Select-String 'WebSocket'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 5: Show summary
Write-Host "[Step 5/5] 🎉 System Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📡 SERVICE ENDPOINTS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Frontend:         http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:      http://localhost:5000" -ForegroundColor White
Write-Host "   WebSocket:        ws://localhost:5001" -ForegroundColor White
Write-Host "   Prisma Studio:    http://localhost:5555" -ForegroundColor White
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTING" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test Backend API:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test WebSocket Detector:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:5001/health" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test with Python client:" -ForegroundColor Yellow
Write-Host "   cd BE" -ForegroundColor Gray
Write-Host "   pip install python-socketio[client] opencv-python" -ForegroundColor Gray
Write-Host "   python test_websocket_client.py webcam" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test with Frontend:" -ForegroundColor Yellow
Write-Host "   Open http://localhost:3000 in browser" -ForegroundColor Gray
Write-Host "   Use WebcamStreamWS component" -ForegroundColor Gray
Write-Host "   Hold license plate in front of webcam" -ForegroundColor Gray
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📊 MONITORING" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "   docker logs -f eparking_backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Check resources:" -ForegroundColor Yellow
Write-Host "   docker stats eparking_backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected RAM: ~3GB for 6 cameras" -ForegroundColor Gray
Write-Host "Expected CPU: <80% for 6 cameras" -ForegroundColor Gray
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📚 DOCUMENTATION" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Read full guide: WEBSOCKET_DETECTION_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Success Criteria:" -ForegroundColor Yellow
Write-Host "   ✅ Video streams with detection overlay (realtime)" -ForegroundColor Green
Write-Host "   ✅ Detection appears instantly (<1 second)" -ForegroundColor Green
Write-Host "   ✅ Green bounding boxes like test project" -ForegroundColor Green
Write-Host "   ✅ System stable with 6 cameras" -ForegroundColor Green
Write-Host "   ✅ RAM usage <5GB total" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 Happy Testing!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
