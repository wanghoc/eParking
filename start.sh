#!/bin/bash

# eParking Docker Setup Script
# Tự động setup và khởi chạy hệ thống eParking

set -e

echo "🚀 eParking Docker Setup"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker không được tìm thấy. Vui lòng cài đặt Docker trước."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose không được tìm thấy. Vui lòng cài đặt Docker Compose trước."
    exit 1
fi

print_success "Docker và Docker Compose đã được cài đặt"

# Check if .env file exists, if not create from template
if [ ! -f .env ]; then
    print_status "Tạo file .env từ template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Đã tạo file .env từ .env.example"
    else
        print_warning "Không tìm thấy file .env.example, tạo file .env mặc định..."
        cat > .env << EOF
# Environment Configuration for eParking System
NODE_ENV=production
DB_HOST=database
DB_USER=eparking_user
DB_PASSWORD=eparking_password_2024
DB_ROOT_PASSWORD=eparking_root_2024
DB_DATABASE_NAME=eParking_db
DB_PORT=3306
DB_DIALECT=mysql
BACKEND_PORT=5000
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=production
ADMINER_PORT=8080
EOF
        print_success "Đã tạo file .env mặc định"
    fi
else
    print_status "File .env đã tồn tại"
fi

# Check if ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port ($service) đang được sử dụng"
        return 1
    fi
    return 0
}

print_status "Kiểm tra ports..."
check_port 3000 "Frontend"
check_port 5000 "Backend"
check_port 3306 "Database"
check_port 8080 "Adminer"

# Stop any running containers
print_status "Dừng các container đang chạy (nếu có)..."
docker-compose down >/dev/null 2>&1 || true

# Build and start services
print_status "Building và khởi chạy services..."
docker-compose up --build -d

# Wait for services to be healthy
print_status "Đợi services khởi động..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep -q "Up (healthy)"; then
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

echo ""

# Check service status
print_status "Kiểm tra trạng thái services..."
docker-compose ps

# Display access information
echo ""
print_success "🎉 eParking đã khởi chạy thành công!"
echo ""
echo "📱 Frontend (React):     http://localhost:3000"
echo "🔗 Backend API:          http://localhost:5000"
echo "🔗 API Health Check:     http://localhost:5000/api/health"
echo "🗄️  Database Admin:       http://localhost:8080"
echo ""
echo "🔐 Database Connection:"
echo "   Host: localhost"
echo "   Port: 3306"
echo "   User: eparking_user"
echo "   Password: eparking_password_2024"
echo "   Database: eParking_db"
echo ""
echo "👤 Demo Accounts:"
echo "   Admin: admin@dlu.edu.vn / 123456"
echo "   Student: hocquang@student.dlu.edu.vn / 123456"
echo ""
echo "🛠️  Useful commands:"
echo "   docker-compose logs -f     # Xem logs"
echo "   docker-compose down        # Dừng hệ thống"
echo "   docker-compose restart     # Restart hệ thống"
echo "   make help                  # Xem tất cả lệnh available"
echo ""

# Test API endpoint
print_status "Testing API connection..."
sleep 5
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    print_success "✅ Backend API đang hoạt động"
else
    print_warning "⚠️  Backend API chưa sẵn sàng, có thể cần thêm thời gian"
fi

print_success "Setup hoàn tất! 🚀"
