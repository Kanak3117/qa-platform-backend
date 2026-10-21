# Infrastructure & Docker Architecture

This document provides an overview of the local containerized infrastructure for the AI-Powered QA Test & Bug Intelligence Platform backend.

---

## 1. Architecture Overview

The system runs as a multi-container stack orchestrated via Docker Compose:

```
                  +--------------------------------+
                  |           Host Machine         |
                  +--------------------------------+
                     | (:8000)                | (:5432)
                     v                        v
        +-------------------------+  +-------------------------+
        |      api service        |  |    postgres service     |
        |   (FastAPI + Uvicorn)   |  |     (PostgreSQL 16)     |
        |                         |  |                         |
        |  1. Runs Alembic head   |  |  Healthcheck:           |
        |  2. Starts Uvicorn      |  |  pg_isready             |
        +-------------------------+  +-------------------------+
                     |                            ^
                     | (internal network)         |
                     +----------------------------+
                                  |
                           [Named Volume]
                           postgres_data
```

### Components

1. **Database Container (`qa_postgres`)**:
   - **Base Image**: `postgres:16`
   - **Database Name**: `qa_platform`
   - **Port**: `5432` mapped to host.
   - **Persistence**: Managed through the named Docker volume `postgres_data` mounted at `/var/lib/postgresql/data`.
   - **Healthcheck**: Uses `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}` every 5s with 5 retries.

2. **API Container (`qa_api`)**:
   - **Base Image**: Custom build based on `python:3.12-slim` ([`Dockerfile`](Dockerfile)).
   - **Port**: `8000` mapped to host.
   - **Dependency Management**: Waits for `qa_postgres` to transition to `healthy` state before starting (`condition: service_healthy`).
   - **Migration on Startup**: Automatically applies all pending Alembic migrations (`alembic upgrade head`) before launching Uvicorn.
   - **Web Server**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

---

## 2. Environment Variables

All configuration is supplied via environment variables. Copy `.env.example` to `.env` and provide your secrets:

| Variable | Description | Example / Default |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL superuser username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | `YOUR_SECURE_PASSWORD` |
| `POSTGRES_DB` | Application database name | `qa_platform` |
| `POSTGRES_PORT` | Host port mapped to PostgreSQL | `5432` |
| `DATABASE_URL` | Used for local development outside Docker | `postgresql+psycopg://user:pass@localhost:5432/qa_platform` |
| `SECRET_KEY` | Secret key for JWT cryptographic signing | Random 32+ character hex string |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration time for access tokens | `60` |

> **Security Note**: Never commit `.env` to version control. The `.env` file is explicitly ignored in `.gitignore` and `.dockerignore`.

---

## 3. Operational Guide

### Start the System
To build (if needed) and run all containers in detached mode:
```bash
docker compose up -d
```

### Stop the System
To stop all running services without deleting database volumes:
```bash
docker compose down
```

To stop and remove containers along with persistent database volumes:
```bash
docker compose down -v
```

### View Logs
To view logs in real time across all services:
```bash
docker compose logs -f
```

To view logs for a specific service:
```bash
docker compose logs -f api
docker compose logs -f postgres
```

### Check Container Status
```bash
docker compose ps
```

### Check Migration Status
Check current Alembic migration revision from within the API container:
```bash
docker compose exec api alembic current
```

Check migration history:
```bash
docker compose exec api alembic history
```

Verify that no un-migrated schema changes exist:
```bash
docker compose exec api alembic check
```

### Rebuild Containers
After updating Python dependencies in `requirements.txt` or making Docker configuration changes:
```bash
docker compose build --no-cache
docker compose up -d
```

### Access Database CLI
To connect to the database via `psql` inside the container:
```bash
docker compose exec -it postgres psql -U postgres -d qa_platform
```

### Verify Endpoints
- **Health check**: `http://localhost:8000/`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **OpenAPI JSON specification**: `http://localhost:8000/openapi.json`
