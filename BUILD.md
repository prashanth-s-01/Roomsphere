# BUILD.md

## Overview
Roomsphere runs as three Docker services:

- `db`: PostgreSQL 16 with a persistent `postgres_data` volume.
- `backend`: Django + Channels + Daphne API server on port `8000`.
- `frontend`: Vite development server on port `5173`.

The backend container starts by running database migrations and then launches `daphne` against `config.asgi:application`. The frontend container installs Node dependencies and starts the Vite dev server.

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose
- Git
- Optional for local-only development:
  - Python 3.12+
  - Node 20+

## Required Environment Variables

Create a `.env` file at the repository root before starting the stack.

Backend and database settings used by the containers:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST` (default inside containers is `db`)
- `POSTGRES_PORT` (default `5432`)
- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`

Email service settings used by the signup OTP flow in the frontend:

- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_OTP_TEMPLATE_ID`

The frontend container also uses:

- `VITE_API_URL` (defaults to `http://localhost:8000/api` in compose)

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd Roomsphere
```

### 2. Create the `.env` file

Example values:

```env
POSTGRES_DB=roomsphere
POSTGRES_USER=roomsphere
POSTGRES_PASSWORD=roomsphere
POSTGRES_HOST=db
POSTGRES_PORT=5432
DJANGO_SECRET_KEY=change-me-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
VITE_API_URL=http://localhost:8000/api
```

### 3. Build the containers

```bash
docker compose build
```

### 4. Start the application

```bash
docker compose up
```

Open these URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`

## How the Containers Work

### Database container

The `db` service runs PostgreSQL and stores data in the named volume `postgres_data`. This keeps the database persistent across restarts.

### Backend container

The `backend` service:

1. Waits for the database health check to pass.
2. Runs Django migrations.
3. Starts Daphne on port `8000`.

This service handles authentication, roommate matching, move-out listings, and messaging APIs.

### Frontend container

The `frontend` service:

1. Installs Node dependencies during image build.
2. Starts Vite on port `5173`.
3. Calls the backend API using `VITE_API_URL`.

## Deployment

### Local deployment with Docker Compose

Use detached mode when you want the stack to keep running in the background:

```bash
docker compose up -d
```

To stop the stack:

```bash
docker compose down
```

To stop the stack and remove the database volume:

```bash
docker compose down -v
```

### Rebuilding after code changes

If you change backend or frontend code, rebuild the affected images:

```bash
docker compose build backend frontend
```

Then restart the services:

```bash
docker compose up -d
```

### Database migrations

The backend container runs migrations automatically on startup. If you need to run them manually:

```bash
docker compose exec backend python manage.py migrate
```

### Creating a Django admin user

```bash
docker compose exec backend python manage.py createsuperuser
```

## Useful Commands

The most important `make` targets are:

- `make build`: build all Docker images.
- `make up`: start the full stack in the foreground.
- `make upd`: start the full stack in the background.
- `make down`: stop the stack.
- `make down-v`: stop the stack and remove the database volume.
- `make restart`: restart all services.
- `make restart-backend`: restart only the Django/Daphne backend.
- `make restart-frontend`: restart only the Vite frontend.
- `make logs`: stream logs for all services.
- `make logs-backend`: stream backend logs.
- `make logs-frontend`: stream frontend logs.
- `make ps`: show running containers.
- `make migrate`: run Django migrations inside the backend container.
- `make makemigrations`: create new Django migrations.
- `make createsuperuser`: create a Django admin user.
- `make fresh`: rebuild and start the stack from a clean state.

```bash
make build
make up
make upd
make down
make down-v
make restart
make restart-backend
make logs-backend
make migrate
make fresh
```

## Testing and Verification

Run the backend test suite inside Docker:

```bash
docker compose run --rm backend python manage.py test
```

Build the frontend locally or in the container:

```bash
cd web
npm run build
```

## Notes

- The backend uses Channels with an in-memory channel layer, so realtime messaging works within the running backend process.
- PostgreSQL data is persistent through the `postgres_data` volume.
- The frontend expects the backend API to be reachable at `VITE_API_URL`.
