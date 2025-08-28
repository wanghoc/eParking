#!/bin/bash

# Setup Environment for eParking System
echo "🚀 Setting up eParking System Environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created successfully!"
        echo "📝 Please edit .env with your configuration"
    else
        echo "📝 Creating .env file with default values..."
        create_env_file
    fi
else
    echo "⚠️  .env file already exists"
fi

# Function to create .env file with default values
create_env_file() {
    cat > .env << EOF
# ========================================
# eParking System Environment Variables
# ========================================

# Database Configuration
DB_HOST=localhost
DB_USER=eparking_user
DB_PASSWORD=123456
DB_DATABASE_NAME=eParking_db
DB_PORT=3306
DB_DIALECT=mysql

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development

# Docker Configuration
DOCKER_NETWORK=eparking_network
MYSQL_ROOT_PASSWORD=123456
MYSQL_DATABASE=eParking_db
MYSQL_USER=eparking_user
MYSQL_PASSWORD=123456

# Development Configuration
LOG_LEVEL=debug
EOF
    echo "✅ .env file created with default values!"
}

echo "🎉 Environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit docker/.env if needed"
echo "2. Run: make build"
echo "3. Run: make up"
echo ""
echo "🔗 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo "- Database: localhost:3306"
