# PowerShell script to update and rebuild Docker containers with latest code

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "eParking - Docker Update Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Stop all containers
Write-Host "🛑 Stopping all containers..." -ForegroundColor Yellow
docker-compose down

# Remove old images (optional - uncomment if you want to force rebuild)
# Write-Host "🗑️  Removing old images..." -ForegroundColor Yellow
# docker-compose down --rmi all

# Rebuild containers
Write-Host "🔨 Building containers with latest code..." -ForegroundColor Yellow
docker-compose build --no-cache

# Copy ML model to volume (first time setup)
Write-Host "📦 Setting up ML models..." -ForegroundColor Yellow
if (Test-Path "BE\ml_models\plate_detector\best.pt") {
    Write-Host "✅ ML model found" -ForegroundColor Green
} else {
    Write-Host "⚠️  ML model not found at BE\ml_models\plate_detector\best.pt" -ForegroundColor Yellow
    Write-Host "   If you have the model, please copy it manually" -ForegroundColor Yellow
}

# Start containers
Write-Host "🚀 Starting containers..." -ForegroundColor Green
docker-compose up -d

# Wait for services to be healthy
Write-Host ""
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check status
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

# Show logs
Write-Host ""
Write-Host "📝 Recent logs:" -ForegroundColor Cyan
docker-compose logs --tail=20

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Update Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running at:" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Prisma:    http://localhost:5555" -ForegroundColor Cyan
Write-Host "  Adminer:   http://localhost:8080 (if enabled with --profile tools)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor Gray
Write-Host "  Stop:          docker-compose down" -ForegroundColor Gray
Write-Host "  Restart:       docker-compose restart" -ForegroundColor Gray
Write-Host "  Shell access:  docker exec -it eparking_backend sh" -ForegroundColor Gray
Write-Host ""
