#!/usr/bin/env pwsh
# Script to check Docker build status for Full ML Mode

Write-Host "🔍 Checking Docker Build Status..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not available!" -ForegroundColor Red
    exit 1
}

# Check containers status
Write-Host "📦 Container Status:" -ForegroundColor Yellow
docker ps -a --filter "name=eparking" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Check images
Write-Host "🖼️  Images:" -ForegroundColor Yellow
docker images --filter "reference=eparking*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
Write-Host ""

# Check build logs (if backend container exists)
$backendContainer = docker ps -a --filter "name=eparking_backend" --format "{{.ID}}" | Select-Object -First 1

if ($backendContainer) {
    Write-Host "📋 Last 20 lines of backend logs:" -ForegroundColor Yellow
    docker logs --tail 20 $backendContainer
    Write-Host ""
}

# Check if services are running
Write-Host "🔍 Service Health Checks:" -ForegroundColor Yellow

# Backend API
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($backend.StatusCode -eq 200) {
        Write-Host "✅ Backend API: Running (http://localhost:5000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API: Not responding" -ForegroundColor Red
}

# Frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($frontend.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Running (http://localhost:3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: Not responding" -ForegroundColor Red
}

# Prisma Studio
try {
    $prisma = Invoke-WebRequest -Uri "http://localhost:5555" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($prisma.StatusCode -eq 200) {
        Write-Host "✅ Prisma Studio: Running (http://localhost:5555)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Prisma Studio: Not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  - View live logs: docker-compose logs -f backend"
Write-Host "  - Check ML status: docker exec eparking_backend python3 -c 'import torch; from ultralytics import YOLO'"
Write-Host "  - Rebuild: docker-compose build --no-cache backend"
Write-Host "  - Full restart: docker-compose down && docker-compose up -d"
