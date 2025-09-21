# eParking Docker Makefile
# Sử dụng: make [command]

.PHONY: help up down build logs clean dev prod restart status

# Default target
help: ## Hiển thị trợ giúp
	@echo "eParking Docker Commands:"
	@echo "========================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Khởi chạy tất cả services
	docker-compose up -d

down: ## Dừng tất cả services
	docker-compose down

build: ## Build lại tất cả images
	docker-compose build

logs: ## Xem logs của tất cả services
	docker-compose logs -f

logs-backend: ## Xem logs của backend
	docker-compose logs -f backend

logs-frontend: ## Xem logs của frontend
	docker-compose logs -f frontend

logs-database: ## Xem logs của database
	docker-compose logs -f database

clean: ## Dừng và xóa tất cả (bao gồm volumes)
	docker-compose down -v --remove-orphans
	docker system prune -f

dev: ## Chạy ở chế độ development
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

prod: ## Chạy ở chế độ production
	NODE_ENV=production docker-compose up -d --build

restart: ## Restart tất cả services
	docker-compose restart

restart-backend: ## Restart backend service
	docker-compose restart backend

restart-frontend: ## Restart frontend service
	docker-compose restart frontend

status: ## Kiểm tra trạng thái services
	docker-compose ps

db-connect: ## Kết nối vào MySQL database
	docker-compose exec database mysql -u eparking_user -p eParking_db

db-backup: ## Backup database
	docker-compose exec database mysqldump -u eparking_user -p eParking_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database từ backup (Sử dụng: make db-restore FILE=backup.sql)
	docker-compose exec -T database mysql -u eparking_user -p eParking_db < $(FILE)

setup: ## Setup ban đầu (tạo .env từ template)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Đã tạo file .env từ template"; \
		echo "⚠️  Vui lòng kiểm tra và cập nhật các biến môi trường trong file .env"; \
	else \
		echo "⚠️  File .env đã tồn tại"; \
	fi

install: setup up ## Setup ban đầu và khởi chạy hệ thống
	@echo "🚀 eParking đang khởi chạy..."
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔗 Backend API: http://localhost:5000"
	@echo "🗄️  Database Admin: http://localhost:8080"
	@echo "⏳ Đợi các services khởi động hoàn tất..."

health: ## Kiểm tra health của các services
	@echo "Checking services health..."
	@docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

update: ## Cập nhật và restart hệ thống
	git pull
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Advanced commands
full-reset: ## Reset hoàn toàn hệ thống (xóa tất cả data)
	@echo "⚠️  CẢNH BÁO: Lệnh này sẽ xóa TẤT CẢ dữ liệu!"
	@read -p "Bạn có chắc chắn không? [y/N]: " confirm && [ "$$confirm" = "y" ]
	docker-compose down -v --remove-orphans
	docker system prune -af
	docker volume prune -f
	@echo "✅ Đã reset hoàn toàn hệ thống"

# Development helpers
shell-backend: ## Mở shell trong backend container
	docker-compose exec backend sh

shell-frontend: ## Mở shell trong frontend container
	docker-compose exec frontend sh

shell-database: ## Mở shell trong database container
	docker-compose exec database bash
