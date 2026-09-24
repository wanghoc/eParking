@echo off
chcp 65001 >nul
title eParking - Cloud
echo Dang khoi dong eParking (database + backend + web)...
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker chua chay. Dang mo Docker Desktop, doi khoang 1 phut...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    :waitdocker
    timeout /t 5 >nul
    docker info >nul 2>&1
    if errorlevel 1 goto waitdocker
)
cd /d "%~dp0"
docker compose up -d
if errorlevel 1 (
    echo Loi khi khoi dong. Xem: docker compose logs
    pause
    exit /b 1
)
echo.
echo  Sinh vien : http://localhost:3000
echo  Admin     : http://localhost:3001
echo  API       : http://localhost:5000
timeout /t 5 >nul
start "" http://localhost:3000
start "" http://localhost:3001
