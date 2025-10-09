@echo off
echo ========================================
echo    eParking - Start without Docker
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo Checking PostgreSQL connection...
psql -h localhost -U eparking_user -d eParking_db -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo WARNING: Cannot connect to PostgreSQL!
    echo Please ensure PostgreSQL is running and database is set up.
    echo Run the setup commands in NON_DOCKER_SETUP.md first.
    echo.
)

echo Starting Backend...
start "Backend" cmd /k "cd /d %~dp0BE && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0FE && npm start"

echo.
echo ========================================
echo Services starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo Prisma Studio: npx prisma studio (in BE folder)
echo ========================================
echo.
echo Press any key to exit...
pause >nul
