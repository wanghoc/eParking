@echo off
REM eParking Docker Deployment Script for Windows
REM This script helps deploy the eParking system with Docker Compose

setlocal enabledelayedexpansion

REM Colors
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:main
echo.
echo ==========================================
echo %BLUE%eParking Docker Deployment%NC%
echo ==========================================
echo.

REM Check if Docker is installed
call :check_docker
if errorlevel 1 exit /b 1

REM Check .env file
call :check_env_file

REM Parse command
if "%1"=="" goto :deploy
if "%1"=="deploy" goto :deploy
if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="logs" goto :logs
if "%1"=="clean" goto :clean
if "%1"=="rebuild" goto :rebuild
if "%1"=="status" goto :status

:usage
echo Usage: deploy.bat [command]
echo.
echo Commands:
echo   deploy   - Full deployment (default)
echo   start    - Start existing containers
echo   stop     - Stop containers
echo   restart  - Restart containers
echo   logs     - Show container logs
echo   clean    - Remove containers and volumes
echo   rebuild  - Rebuild and restart containers
echo   status   - Show container status
exit /b 0

:check_docker
echo Checking Docker installation...
where docker >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Docker is not installed%NC%
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose version >nul 2>&1
    if errorlevel 1 (
        echo %RED%Error: Docker Compose is not installed%NC%
        exit /b 1
    )
)

echo %GREEN%Docker and Docker Compose are installed%NC%
exit /b 0

:check_env_file
if not exist .env (
    echo %YELLOW%Creating .env file...%NC%
    (
        echo # eParking Environment Configuration
        echo NODE_ENV=production
        echo.
        echo # Database Configuration
        echo DB_HOST=postgres
        echo DB_PORT=5432
        echo DB_USER=eparking_user
        echo DB_PASSWORD=eparking_password_2024
        echo DB_DATABASE_NAME=eParking_db
        echo.
        echo # Backend Configuration
        echo BACKEND_PORT=5000
        echo USE_PRISMA=true
        echo USE_ML=true
        echo.
        echo # Frontend Configuration
        echo FRONTEND_PORT=3000
        echo REACT_APP_API_URL=http://localhost:5000
        echo REACT_APP_ENVIRONMENT=production
        echo REACT_APP_WS_URL=ws://localhost:5001
        echo.
        echo # Optional Tools
        echo ADMINER_PORT=8080
    ) > .env
    echo %GREEN%.env file created%NC%
) else (
    echo %GREEN%.env file exists%NC%
)
exit /b 0

:deploy
echo.
echo ==========================================
echo %BLUE%Stopping existing containers...%NC%
echo ==========================================
echo.
docker-compose down

echo.
echo ==========================================
echo %BLUE%Building and starting containers...%NC%
echo ==========================================
echo.
docker-compose up -d --build

echo.
echo ==========================================
echo %BLUE%Waiting for services...%NC%
echo ==========================================
echo.

timeout /t 10 /nobreak >nul

call :show_info

set /p "logs=Do you want to see the logs? (y/N): "
if /i "%logs%"=="y" goto :logs
exit /b 0

:start
echo.
echo ==========================================
echo %BLUE%Starting containers...%NC%
echo ==========================================
echo.
docker-compose up -d
call :show_info
exit /b 0

:stop
echo.
echo ==========================================
echo %BLUE%Stopping containers...%NC%
echo ==========================================
echo.
docker-compose stop
echo %GREEN%Containers stopped%NC%
exit /b 0

:restart
echo.
echo ==========================================
echo %BLUE%Restarting containers...%NC%
echo ==========================================
echo.
docker-compose restart
echo %GREEN%Containers restarted%NC%
exit /b 0

:logs
echo.
echo ==========================================
echo %BLUE%Container logs%NC%
echo ==========================================
echo.
docker-compose logs -f
exit /b 0

:clean
echo.
echo ==========================================
echo %BLUE%Cleaning up...%NC%
echo ==========================================
echo.
set /p "confirm=Are you sure? This will remove all data! (y/N): "
if /i not "%confirm%"=="y" exit /b 0
docker-compose down -v
echo %GREEN%Containers and volumes removed%NC%
exit /b 0

:rebuild
echo.
echo ==========================================
echo %BLUE%Rebuilding containers...%NC%
echo ==========================================
echo.
docker-compose down
docker-compose up -d --build
timeout /t 10 /nobreak >nul
call :show_info
exit /b 0

:status
echo.
echo ==========================================
echo %BLUE%Container status%NC%
echo ==========================================
echo.
docker-compose ps
exit /b 0

:show_info
echo.
echo ==========================================
echo %GREEN%Deployment successful!%NC%
echo ==========================================
echo.
echo Access the application:
echo.
echo   %GREEN%Frontend:      http://localhost:3000%NC%
echo   %GREEN%Backend API:   http://localhost:5000%NC%
echo   %GREEN%Prisma Studio: http://localhost:5555%NC%
echo   %GREEN%Adminer:       http://localhost:8080%NC%
echo.
echo Demo accounts:
echo.
echo   %YELLOW%Admin:%NC%
echo     Email:    admin@example.com
echo     Password: admin123
echo.
echo   %YELLOW%User:%NC%
echo     Email:    user@example.com
echo     Password: user123
echo.
echo Useful commands:
echo.
echo   View logs:         deploy.bat logs
echo   Stop services:     deploy.bat stop
echo   Restart services:  deploy.bat restart
echo   Remove containers: deploy.bat clean
echo.
exit /b 0

