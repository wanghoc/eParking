# Build script for eParking Frontend (PowerShell)
Write-Host "Building eParking Frontend..." -ForegroundColor Green

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Build folder is ready for deployment." -ForegroundColor Green
    Write-Host "Build folder location: ./build/" -ForegroundColor Cyan
    Write-Host "You can now copy the build folder to your server." -ForegroundColor Cyan
}
else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
