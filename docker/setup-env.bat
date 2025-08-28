@echo off
echo 🚀 Setting up eParking System Environment...

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from env.example...
    if exist env.example (
        copy env.example .env
        echo ✅ .env file created successfully!
    ) else (
        echo 📝 Creating .env file with default values...
        (
            echo # ========================================
            echo # eParking System Environment Variables
            echo # ========================================
            echo.
            echo # Database Configuration
            echo DB_HOST=localhost
            echo DB_USER=eparking_user
            echo DB_PASSWORD=123456
            echo DB_DATABASE_NAME=eParking_db
            echo DB_PORT=3306
            echo DB_DIALECT=mysql
            echo.
            echo # Server Configuration
            echo PORT=5000
            echo NODE_ENV=development
            echo.
            echo # JWT Configuration
            echo JWT_SECRET=your_jwt_secret_key_here_change_in_production
            echo JWT_EXPIRES_IN=24h
            echo.
            echo # Frontend Configuration
            echo REACT_APP_API_URL=http://localhost:5000
            echo REACT_APP_ENV=development
            echo.
            echo # Docker Configuration
            echo DOCKER_NETWORK=eparking_network
            echo MYSQL_ROOT_PASSWORD=123456
            echo MYSQL_DATABASE=eParking_db
            echo MYSQL_USER=eparking_user
            echo MYSQL_PASSWORD=123456
            echo.
            echo # Development Configuration
            echo LOG_LEVEL=debug
        ) > .env
        echo ✅ .env file created with default values!
    )
    echo 📝 Please edit .env with your configuration
) else (
    echo ⚠️  .env file already exists
)

echo.
echo 🎉 Environment setup completed!
echo.
echo 📋 Next steps:
echo 1. Edit docker\.env if needed
echo 2. Run: make build
echo 3. Run: make up
echo.
echo 🔗 Access URLs:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo - Database: localhost:3306
echo.
pause
