# Finance Data Processing and Access Control Backend

Production-style Node.js backend for a finance dashboard with strict RBAC, real SQL persistence, analytics APIs, and deployment-ready setup.

## Live Deployment

- Public API: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1`
- Health: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/health`
- OpenAPI: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/docs`
- Full endpoint docs: [`docs/API_USAGE.md`](docs/API_USAGE.md)
- Postman Collection (Repo): `https://github.com/juSt-jeLLy/Zorvyn/blob/main/docs/postman/Finance-Dashboard-API.postman_collection.json`
- Postman Collection (Raw Import URL): `https://raw.githubusercontent.com/juSt-jeLLy/Zorvyn/main/docs/postman/Finance-Dashboard-API.postman_collection.json`

## Primary Framework

- Node.js (Express + TypeScript)

## Architecture Summary

- Layered architecture with strict separation of concerns:
  - `routes` for transport concerns
  - `controllers` for HTTP orchestration
  - `services` for business logic
  - `repositories` for SQL data access
  - `infrastructure` for DB/logging/runtime setup
- **Repository Pattern** in user and financial record modules.
- **Dependency Injection Pattern** in `src/container.ts`.
- **Strategy Pattern** for weekly/monthly trend bucketing.
- Fail-fast validation at API boundaries (Zod).
- Structured error model with consistent API error payload.
- Structured request logging with request IDs and sensitive-field redaction.

## Tech Stack

- Node.js + Express + TypeScript
- SQLite (real persistent DB file on disk)
- `sqlite` + `sqlite3` for SQL access
- Zod for validation
- JWT + bcrypt for authentication
- Vitest for tests

## Features Delivered

### Core Requirements

1. User and Role Management
- Create/list/get/update users
- Role assignment (`VIEWER`, `ANALYST`, `ADMIN`)
- User status management (`ACTIVE`, `INACTIVE`)
- Backend-enforced role restrictions

2. Financial Records Management
- Create/read/update/soft-delete records
- Filters: date range, type, category
- Pagination support
- Search support (`category` and `notes`)

3. Dashboard Summary APIs
- Total income, expenses, net balance
- Category-wise totals
- Recent activity
- Trend analytics (weekly/monthly)

4. Access Control Logic
- JWT-based auth
- Role-based route guards
- Inactive user lockout

5. Validation and Error Handling
- Input validation with actionable errors
- Structured error body + request ID
- Proper status codes

6. Data Persistence
- Real SQLite database persisted at `./data/finance.db`
- SQL schema + indexes auto-created on startup

### Optional/Additional Enhancements Included

- Soft delete for records (`deleted_at`)
- Pagination and search on record listing
- Rate limiting (`express-rate-limit`)
- API docs endpoint (`GET /api/v1/docs`)
- Seed script for demo data
- Docker deployment files

## API Surface

Base URL: `http://localhost:4000/api/v1`

- `GET /health`
- `GET /docs`
- `POST /auth/login`
- `POST /users` (ADMIN)
- `GET /users` (ADMIN)
- `GET /users/:userId` (ADMIN)
- `PATCH /users/:userId` (ADMIN)
- `POST /records` (ADMIN)
- `GET /records` (ADMIN, ANALYST)
- `GET /records/:recordId` (ADMIN, ANALYST)
- `PATCH /records/:recordId` (ADMIN)
- `DELETE /records/:recordId` (ADMIN)
- `GET /dashboard/summary` (ADMIN, ANALYST, VIEWER)
- `GET /dashboard/trend` (ADMIN, ANALYST, VIEWER)

## Quick Start

```bash
npm install
npm run db:init
npm run seed
npm run dev
```

## Live Demo Data

```bash
npm run demo:seed-live
```

This seeds tagged records (`PUBLIC_DEMO_V1`) on the deployed API in an idempotent way.

Shared local/demo files:
- [`.env.local`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/.env.local)
- [`.env.live.local`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/.env.live.local)
- [`data/demo-data.json`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/data/demo-data.json)

## Default Seed Users

- `admin@finance.local / ChangeMe123!` (ADMIN)
- `analyst@finance.local / AnalystPass123!` (ANALYST)
- `viewer@finance.local / ViewerPass123!` (VIEWER)

## Environment Variables

See `.env.example`.

- `PORT`
- `NODE_ENV`
- `DATA_FILE_PATH`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_NAME`

## Test

```bash
npm test
```

## Deployment (Docker)

```bash
docker compose up --build
```

This persists SQLite data through a mounted `./data` volume.

## Security Notes

- JWT auth and role guards enforced server-side
- Parameterized SQL queries (no string interpolation for user inputs)
- Sensitive data redaction in logs
- Request rate limiting enabled

## Scalability Notes

- Query indexes for frequent filters and sorting dimensions
- Aggregation endpoints use SQL grouping to avoid N+1 behavior
- Stateless API process; horizontal scaling ready with external DB (Postgres migration path)
- Natural caching candidates: dashboard summary/trend endpoints

## Assumptions

- Amounts are stored in integer cents for precision.
- Date filters are inclusive.
- Soft-deleted records are excluded from dashboard aggregates.
