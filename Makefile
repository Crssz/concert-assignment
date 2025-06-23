# Makefile for Concert Assignment Docker Compose

# Variables
COMPOSE_FILE = docker-compose.dev.yaml
COMPOSE_FILE_PROD = docker-compose.prod.yaml
COMPOSE_PROJECT_NAME = concert-assignment

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "Concert Assignment Docker Compose Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development environment commands
.PHONY: up
up: ## Start all services in detached mode
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) up -d

.PHONY: down
down: ## Stop and remove all containers, networks
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) down

.PHONY: start
start: ## Start existing containers
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) start

.PHONY: stop
stop: ## Stop running containers
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) stop

.PHONY: restart
restart: ## Restart all services
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) restart

.PHONY: build
build: ## Build or rebuild services
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) build

.PHONY: rebuild
rebuild: ## Rebuild services and start
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) build --no-cache
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) up -d

# Monitoring and debugging
.PHONY: logs
logs: ## Show logs from all services
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) logs -f

.PHONY: logs-postgres
logs-postgres: ## Show PostgreSQL logs
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) logs -f postgres

.PHONY: logs-redis
logs-redis: ## Show Redis logs
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) logs -f redis

.PHONY: status
status: ## Show status of all services
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) ps

.PHONY: health
health: ## Check health status of services
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Database operations
.PHONY: db-connect
db-connect: ## Connect to PostgreSQL database
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) exec postgres psql -U concert_user -d concert_dev

.PHONY: redis-cli
redis-cli: ## Connect to Redis CLI
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) exec redis redis-cli -a redis_password

# Cleanup commands
.PHONY: clean
clean: ## Stop containers and remove volumes
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) down -v

.PHONY: clean-all
clean-all: ## Stop containers, remove volumes, networks, and images
	docker-compose -f $(COMPOSE_FILE) -p $(COMPOSE_PROJECT_NAME) down -v --rmi all

.PHONY: prune
prune: ## Remove unused Docker resources
	docker system prune -f
	docker volume prune -f

# Development workflow
.PHONY: dev
dev: ## Start development environment (up + logs)
	make up
	make logs

.PHONY: fresh
fresh: ## Fresh start - clean and rebuild everything
	make clean
	make build
	make up

# Quick commands
.PHONY: quick-start
quick-start: up ## Quick start (alias for up)

.PHONY: quick-stop
quick-stop: down ## Quick stop (alias for down)

# Production environment commands
.PHONY: prod-up
prod-up: ## Start production services in detached mode
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod up -d

.PHONY: prod-down
prod-down: ## Stop and remove production containers
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod down

.PHONY: prod-build
prod-build: ## Build production images
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod build

.PHONY: prod-logs
prod-logs: ## Show production logs
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod logs -f

.PHONY: prod-status
prod-status: ## Show production services status
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod ps

.PHONY: prod-deploy
prod-deploy: ## Deploy to production (build and up)
	@echo "Building production images..."
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod build
	@echo "Starting production services..."
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod up -d
	@echo "Production deployment complete!"
	make prod-status

.PHONY: prod-restart
prod-restart: ## Restart production services
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod restart

.PHONY: prod-scale-api
prod-scale-api: ## Scale API service (usage: make prod-scale-api n=3)
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod up -d --scale api=$(n)

.PHONY: prod-scale-app
prod-scale-app: ## Scale App service (usage: make prod-scale-app n=3)
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod up -d --scale app=$(n)

.PHONY: prod-backup
prod-backup: ## Backup production database
	@echo "Creating database backup..."
	docker-compose -f $(COMPOSE_FILE_PROD) -p $(COMPOSE_PROJECT_NAME)-prod exec -T postgres pg_dump -U concert_user concert_prod > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed!" 