# MeetingBot Docker Compose Makefile

.PHONY: help setup build start stop restart logs clean build-bots health-check

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Set up the environment and build bot images
	@chmod +x setup.sh
	@./setup.sh

build-bots: ## Build all bot Docker images
	@chmod +x build-bots.sh
	@./build-bots.sh

build: build-bots ## Build all Docker images
	@docker-compose build

start: ## Start all services
	@docker-compose up -d
	@echo "✅ MeetingBot started successfully!"
	@echo ""
	@echo "Services available at:"
	@echo "  - MeetingBot Server: http://localhost:3000"
	@echo "  - MinIO Console: http://localhost:9001"

stop: ## Stop all services
	@docker-compose down
	@echo "✅ MeetingBot stopped successfully!"

restart: stop start ## Restart all services

logs: ## View logs from all services
	@docker-compose logs -f

logs-server: ## View server logs
	@docker-compose logs -f server

logs-bots: ## View bot container logs (if any are running)
	@docker ps --filter "name=meetingbot-bot-" --format "table {{.Names}}" | tail -n +2 | xargs -r docker logs -f

clean: ## Clean up containers, images, and volumes
	@docker-compose down -v
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Cleanup complete!"

dev: ## Start in development mode with live reloading
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Database operations
db-migrate: ## Run database migrations
	@docker-compose exec server pnpm db:migrate

db-studio: ## Open Drizzle Studio
	@docker-compose exec server pnpm db:studio

# MinIO operations
minio-setup: ## Set up MinIO bucket
	@echo "Setting up MinIO bucket..."
	@sleep 5 # Wait for MinIO to start
	@docker-compose exec server sh -c 'curl -X PUT "http://minio:9000/meetingbot-recordings" || echo "Bucket may already exist"'

health-check: ## Check if all services are running correctly
	@chmod +x health-check.sh
	@./health-check.sh