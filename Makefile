.PHONY: build up down restart logs ps shell-backend shell-db migrate makemigrations createsuperuser test-backend test-backend-message-flow test-backend-file

# Build all services
build:
	docker compose build

# Start all services
up:
	docker compose up

# Start all services in background
upd:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Stop and remove volumes (wipes database)
down-v:
	docker compose down -v

# Restart all services
restart:
	docker compose restart

# Restart a specific service (make restart-backend)
restart-backend:
	docker compose restart backend

restart-frontend:
	docker compose restart frontend

restart-db:
	docker compose restart db

# View logs of all services
logs:
	docker compose logs -f

# View logs of specific service
logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

# Check running containers
ps:
	docker compose ps

# Shell into backend container
shell-backend:
	docker compose exec backend bash

# Shell into db container
shell-db:
	docker compose exec db psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

# Django commands
migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

createsuperuser:
	docker compose exec backend python manage.py createsuperuser

# Tests
test-backend:
	docker compose run --rm backend pytest -q

# Usage: make test-backend-file TEST=tests/test_message_flow.py
test-backend-file:
	docker compose run --rm backend pytest $(TEST) -q

# Build and start fresh
fresh:
	docker compose down -v
	docker compose up --build