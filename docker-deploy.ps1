# Docker Deploy Script for eParking with Chatbot
# Run: .\docker-deploy.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  eParking Docker Deployment" -ForegroundColor Cyan
Write-Host "  with Chatbot AI Integration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ File .env not found!" -ForegroundColor Red
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host "`n⚠️  Please edit .env and add your GEMINI_API_KEY" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://makersuite.google.com/app/apikey`n" -ForegroundColor Yellow
    exit 1
}

# Check if GEMINI_API_KEY is configured
$envContent = Get-Content ".env" -Raw
if ($envContent -match "GEMINI_API_KEY=your_gemini_api_key_here" -or $envContent -notmatch "GEMINI_API_KEY=") {
    Write-Host "⚠️  Warning: GEMINI_API_KEY not configured in .env" -ForegroundColor Yellow
    Write-Host "   Chatbot will not work without valid API key" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://makersuite.google.com/app/apikey`n" -ForegroundColor Yellow
    
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
}

Write-Host "🐳 Starting Docker Compose..." -ForegroundColor Cyan

# Stop any existing containers
Write-Host "`n📦 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start services
Write-Host "`n🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be healthy
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check service status
Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

# Show logs
Write-Host "`n📋 Recent logs:" -ForegroundColor Cyan
docker-compose logs --tail=20

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:   http://localhost:5000" -ForegroundColor White
Write-Host "   API Health:    http://localhost:5000/api/health" -ForegroundColor White
Write-Host "   Chatbot API:   http://localhost:5000/api/chatbot/chat" -ForegroundColor White
Write-Host "   Prisma Studio: http://localhost:5555" -ForegroundColor White
Write-Host "   Adminer:       http://localhost:8080 (run with --profile tools)" -ForegroundColor Gray

Write-Host "`n📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop:          docker-compose down" -ForegroundColor White
Write-Host "   Restart:       docker-compose restart" -ForegroundColor White
Write-Host "   Shell backend: docker-compose exec backend sh" -ForegroundColor White

Write-Host "`n🤖 Chatbot Features:" -ForegroundColor Cyan
Write-Host "   ✅ Natural language queries with Gemini AI" -ForegroundColor White
Write-Host "   ✅ License plate recognition from images" -ForegroundColor White
Write-Host "   ✅ Revenue statistics and parking history" -ForegroundColor White
Write-Host "   ✅ Database queries via function calling" -ForegroundColor White

Write-Host "`n💡 To test chatbot:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:3000" -ForegroundColor White
Write-Host "   2. Login to the system" -ForegroundColor White
Write-Host "   3. Click the blue chatbot button (bottom right)" -ForegroundColor White
Write-Host "   4. Try: 'Cho tôi biết hôm nay có bao nhiêu xe vào?'" -ForegroundColor White
Write-Host ""
