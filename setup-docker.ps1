# eParking - Quick Setup Script
# Chọn giữa Mock Mode (nhanh) hoặc Full ML Mode (chậm)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   eParking - Docker Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Chọn chế độ setup:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🚀 MOCK MODE (Khuyến nghị - Nhanh < 5 phút)" -ForegroundColor Green
Write-Host "   - Không cài ML trong Docker"
Write-Host "   - Dùng mock data để test"
Write-Host "   - Build nhanh, image nhỏ"
Write-Host ""
Write-Host "2. 🤖 FULL ML MODE (Chậm 10-15 phút)" -ForegroundColor Yellow
Write-Host "   - Cài đầy đủ ML trong Docker"
Write-Host "   - YOLOv8 + EasyOCR"
Write-Host "   - Build lâu, image lớn (~2GB)"
Write-Host ""

$choice = Read-Host "Nhập lựa chọn (1 hoặc 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "✅ Đã chọn: MOCK MODE" -ForegroundColor Green
    Write-Host ""
    
    # Stop containers
    Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
    docker-compose down
    
    # Update docker-compose to use simple Dockerfile
    Write-Host "📝 Updating docker-compose.yml..." -ForegroundColor Yellow
    
    $dockerCompose = Get-Content "docker-compose.yml" -Raw
    if ($dockerCompose -match "dockerfile: Dockerfile\.simple") {
        Write-Host "   ✅ Already using Dockerfile.simple" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Manual step needed:" -ForegroundColor Yellow
        Write-Host "   Edit docker-compose.yml, change:" -ForegroundColor Gray
        Write-Host "     dockerfile: Dockerfile" -ForegroundColor Red
        Write-Host "   To:" -ForegroundColor Gray
        Write-Host "     dockerfile: Dockerfile.simple" -ForegroundColor Green
        Write-Host ""
        $continue = Read-Host "Press Enter after editing (or Ctrl+C to cancel)"
    }
    
    # Set USE_ML=false in .env
    Write-Host "📝 Setting USE_ML=false..." -ForegroundColor Yellow
    if (Test-Path ".env") {
        $env = Get-Content ".env"
        $env = $env -replace "USE_ML=true", "USE_ML=false"
        $env | Set-Content ".env"
        Write-Host "   ✅ Updated .env" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env not found, creating..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        $env = Get-Content ".env"
        $env = $env -replace "USE_ML=true", "USE_ML=false"
        $env | Set-Content ".env"
    }
    
    # Build
    Write-Host ""
    Write-Host "🔨 Building backend (simple mode)..." -ForegroundColor Yellow
    docker-compose build backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    # Start
    Write-Host ""
    Write-Host "🚀 Starting services..." -ForegroundColor Green
    docker-compose up -d
    
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "✅ Setup Complete (Mock Mode)!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Services:" -ForegroundColor White
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Note:" -ForegroundColor Yellow
    Write-Host "   - ML detection sẽ trả MOCK DATA" -ForegroundColor Gray
    Write-Host "   - Plate number: 30A-12345 (fake)" -ForegroundColor Gray
    Write-Host "   - Để có real ML, xem: SOLUTION_QUICK_NO_ML.md" -ForegroundColor Gray
    Write-Host ""
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "✅ Đã chọn: FULL ML MODE" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Cảnh báo:" -ForegroundColor Yellow
    Write-Host "   - Build sẽ mất 10-15 phút" -ForegroundColor Gray
    Write-Host "   - Cần tải ~1.5GB dependencies" -ForegroundColor Gray
    Write-Host "   - Docker image ~2GB" -ForegroundColor Gray
    Write-Host ""
    
    $confirm = Read-Host "Tiếp tục? (y/n)"
    
    if ($confirm -eq "y") {
        # Stop containers
        Write-Host ""
        Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
        docker-compose down
        
        # Set USE_ML=true
        Write-Host "📝 Setting USE_ML=true..." -ForegroundColor Yellow
        if (Test-Path ".env") {
            $env = Get-Content ".env"
            $env = $env -replace "USE_ML=false", "USE_ML=true"
            $env | Set-Content ".env"
        }
        
        # Build (this will take long)
        Write-Host ""
        Write-Host "🔨 Building backend with ML..." -ForegroundColor Yellow
        Write-Host "   ⏳ This will take 10-15 minutes..." -ForegroundColor Gray
        Write-Host ""
        
        docker-compose build --no-cache backend
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "   ✅ Build successful!" -ForegroundColor Green
            
            # Start
            Write-Host ""
            Write-Host "🚀 Starting services..." -ForegroundColor Green
            docker-compose up -d
            
            Start-Sleep -Seconds 15
            
            # Test ML
            Write-Host ""
            Write-Host "🧪 Testing ML libraries..." -ForegroundColor Cyan
            docker exec eparking_backend python3 --version
            docker exec eparking_backend python3 -c "import cv2; print('OpenCV:', cv2.__version__)"
            
            Write-Host ""
            Write-Host "=========================================" -ForegroundColor Cyan
            Write-Host "✅ Setup Complete (Full ML Mode)!" -ForegroundColor Green
            Write-Host "=========================================" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "❌ Build failed!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Có thể thử:" -ForegroundColor Yellow
            Write-Host "   1. Chạy lại script này và chọn MOCK MODE" -ForegroundColor Gray
            Write-Host "   2. Xem logs: docker-compose logs backend" -ForegroundColor Gray
            Write-Host "   3. Đọc: SOLUTION_QUICK_NO_ML.md" -ForegroundColor Gray
        }
    } else {
        Write-Host "Đã hủy." -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ Lựa chọn không hợp lệ!" -ForegroundColor Red
    exit 1
}

Write-Host ""
