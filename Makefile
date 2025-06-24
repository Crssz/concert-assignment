# Makefile for Concert Assignment Docker Compose

# Variables
COMPOSE_FILE = docker-compose.dev.yaml
COMPOSE_FILE_PROD = docker-compose.prod.yaml
COMPOSE_FILE_PROD_NO_SSL = docker-compose.prod-no-ssl.yaml
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

# Production (No SSL) environment commands
.PHONY: prod-no-ssl-up
prod-no-ssl-up: ## Start production (no SSL) services in detached mode
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl up -d

.PHONY: prod-no-ssl-down
prod-no-ssl-down: ## Stop and remove production (no SSL) containers
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl down

.PHONY: prod-no-ssl-build
prod-no-ssl-build: ## Build production (no SSL) images
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl build

.PHONY: prod-no-ssl-logs
prod-no-ssl-logs: ## Show production (no SSL) logs
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl logs -f

.PHONY: prod-no-ssl-status
prod-no-ssl-status: ## Show production (no SSL) services status
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl ps

.PHONY: prod-no-ssl-deploy
prod-no-ssl-deploy: ## Deploy to production without SSL (build and up)
	@echo "Building production (no SSL) images..."
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl build
	@echo "Starting production (no SSL) services..."
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl up -d
	@echo "Production (no SSL) deployment complete!"
	make prod-no-ssl-status

.PHONY: prod-no-ssl-restart
prod-no-ssl-restart: ## Restart production (no SSL) services
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl restart

.PHONY: prod-no-ssl-scale-api
prod-no-ssl-scale-api: ## Scale API service in no SSL mode (usage: make prod-no-ssl-scale-api n=3)
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl up -d --scale api=$(n)

.PHONY: prod-no-ssl-scale-app
prod-no-ssl-scale-app: ## Scale App service in no SSL mode (usage: make prod-no-ssl-scale-app n=3)
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl up -d --scale app=$(n)

.PHONY: prod-no-ssl-backup
prod-no-ssl-backup: ## Backup production (no SSL) database
	@echo "Creating database backup..."
	docker-compose -f $(COMPOSE_FILE_PROD_NO_SSL) -p $(COMPOSE_PROJECT_NAME)-prod-no-ssl exec -T postgres pg_dump -U concert_user concert_prod > backup_no_ssl_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed!" 