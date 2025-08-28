.PHONY: help build up down restart logs clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	cd docker && docker-compose build

up: ## Start all services
	cd docker && docker-compose up -d

down: ## Stop all services
	cd docker && docker-compose down

restart: ## Restart all services
	cd docker && docker-compose restart

logs: ## Show logs from all services
	cd docker && docker-compose logs -f

logs-backend: ## Show backend logs
	cd docker && docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	cd docker && docker-compose logs -f frontend

logs-db: ## Show database logs
	cd docker && docker-compose logs -f db

clean: ## Remove all containers, networks, and volumes
	cd docker && docker-compose down -v --remove-orphans
	docker system prune -f

db-shell: ## Access MySQL shell
	cd docker && docker-compose exec db mysql -u root -p123456

backend-shell: ## Access backend container shell
	cd docker && docker-compose exec backend sh

frontend-shell: ## Access frontend container shell
	cd docker && docker-compose exec frontend sh

install-deps: ## Install dependencies for local development
	cd BE && npm install
	cd FE && npm install

dev: ## Start development environment
	cd docker && docker-compose up -d db
	cd BE && npm run dev &
	cd FE && npm start

env-setup: ## Setup environment file
	@echo "Creating .env file from .env.example..."
	@if [ ! -f docker/.env ]; then \
		cp docker/.env.example docker/.env; \
		echo "✅ .env file created successfully!"; \
		echo "📝 Please edit docker/.env with your configuration"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

mysql-only: ## Start only MySQL database
	cd docker && docker-compose up -d db

backend-only: ## Start only backend service
	cd docker && docker-compose up -d db backend

frontend-only: ## Start only frontend service
	cd docker && docker-compose up -d db backend frontend
