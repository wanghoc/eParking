# Test script for Plate Recognizer
# Kiểm tra xem Custom Plate Recognizer đã được deploy thành công chưa

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Testing Plate Recognizer Deployment" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# 1. Check if containers are running
Write-Host "[1/5] Checking containers..." -ForegroundColor Yellow
$containers = docker ps --filter "name=eparking" --format "{{.Names}}: {{.Status}}"
if ($containers) {
    $containers | ForEach-Object { Write-Host "  ✅ $_" -ForegroundColor Green }
} else {
    Write-Host "  ❌ No containers running!" -ForegroundColor Red
    exit 1
}

# 2. Check if model file exists in container
Write-Host "`n[2/5] Checking model file in container..." -ForegroundColor Yellow
$modelCheck = docker exec eparking_backend ls -lh ml_models/character_recognition/plate_recognizer.pt 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Model file found:" -ForegroundColor Green
    Write-Host "    $modelCheck" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Model file NOT found!" -ForegroundColor Red
    Write-Host "    $modelCheck" -ForegroundColor Red
    exit 1
}

# 3. Check if Python module can be imported
Write-Host "`n[3/5] Testing Python module import..." -ForegroundColor Yellow
$importTest = docker exec eparking_backend python3 -c "import sys; sys.path.insert(0, 'ml_models/character_recognition'); from plate_recognizer_inference import PlateRecognizer; print('Module imported successfully')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ $importTest" -ForegroundColor Green
} else {
    Write-Host "  ❌ Module import failed!" -ForegroundColor Red
    Write-Host "    $importTest" -ForegroundColor Red
}

# 4. Check PyTorch availability
Write-Host "`n[4/5] Checking PyTorch..." -ForegroundColor Yellow
$torchTest = docker exec eparking_backend python3 -c "import torch; print(f'PyTorch {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ PyTorch ready:" -ForegroundColor Green
    $torchTest -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "  ❌ PyTorch check failed!" -ForegroundColor Red
    Write-Host "    $torchTest" -ForegroundColor Red
}

# 5. Check backend API health
Write-Host "`n[5/5] Checking backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Backend API is healthy" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "    Status: $($content.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️  Backend API check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Containers: Running" -ForegroundColor Green
Write-Host "✅ Model File: Present" -ForegroundColor Green

if ($importTest -match "successfully") {
    Write-Host "✅ Module Import: Success" -ForegroundColor Green
} else {
    Write-Host "⚠️  Module Import: Needs verification" -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Test license plate detection via API" -ForegroundColor White
Write-Host "  2. Monitor backend logs: docker logs -f eparking_backend" -ForegroundColor White
Write-Host "  3. Check WebSocket detector: http://localhost:5001/health" -ForegroundColor White
Write-Host ""
