# Finance Dashboard API Documentation

## Live Deployment Links

- API Base URL: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1`
- Health URL: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/health`
- OpenAPI URL: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/docs`

## Full Live Endpoint URLs

- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/health` (public)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/docs` (public)
- `POST https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/auth/login` (public)
- `POST https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/users` (ADMIN)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/users` (ADMIN)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/users/:userId` (ADMIN)
- `PATCH https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/users/:userId` (ADMIN)
- `POST https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/records` (ADMIN)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/records` (ADMIN, ANALYST)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/records/:recordId` (ADMIN, ANALYST)
- `PATCH https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/records/:recordId` (ADMIN)
- `DELETE https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/records/:recordId` (ADMIN)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/dashboard/summary` (VIEWER, ANALYST, ADMIN)
- `GET https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/dashboard/trend` (VIEWER, ANALYST, ADMIN)

## Authentication

This API uses JWT bearer tokens.

1. Call `POST /auth/login`
2. Read `data.accessToken`
3. Pass token header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Demo Users (Live)

- Admin: `admin@finance.local` / `ChangeMe123!`
- Analyst: `analyst@finance.local` / `AnalystPass123!`
- Viewer: `viewer@finance.local` / `ViewerPass123!`

## Live Demo Data Pack

A tagged dataset is supported with tag `PUBLIC_DEMO_V1`.

- Seeding script: [`scripts/seed-live-demo.mjs`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/scripts/seed-live-demo.mjs)
- Data source file: [`data/demo-data.json`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/data/demo-data.json)
- Shared local env file: [`.env.local`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/.env.local)
- Shared live env file: [`.env.live.local`](/Users/yagnesh/Desktop/2026%20HACKATHONS/merge/finance-dashboard-backend/.env.live.local)
- Command:

```bash
npm run demo:seed-live
```

This script is idempotent and only creates missing tagged records.

Query only demo records:

```bash
BASE_URL="https://finance-dashboard-api-production-6a11.up.railway.app/api/v1"
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.local","password":"ChangeMe123!"}' | jq -r '.data.accessToken')

curl -s "$BASE_URL/records?page=1&pageSize=100&search=PUBLIC_DEMO_V1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Role Access Matrix

- `VIEWER`: dashboard APIs only
- `ANALYST`: dashboard APIs + record read/list APIs
- `ADMIN`: full access

## Common Response Shapes

### Success

```json
{
  "data": {}
}
```

### Paginated List

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 120
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "requestId": "...",
    "details": {}
  }
}
```

## API Usage by Endpoint

## 1) Health and Docs

### GET `/health`

```bash
curl -X GET "https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/health"
```

### GET `/docs`

```bash
curl -X GET "https://finance-dashboard-api-production-6a11.up.railway.app/api/v1/docs"
```

## 2) Auth

### POST `/auth/login`

Request body:

```json
{
  "email": "admin@finance.local",
  "password": "ChangeMe123!"
}
```

```bash
BASE_URL="https://finance-dashboard-api-production-6a11.up.railway.app/api/v1"
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.local","password":"ChangeMe123!"}'
```

## 3) Users (ADMIN)

### POST `/users`

```bash
curl -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Analyst","email":"alice@example.com","password":"StrongPass123!","role":"ANALYST","status":"ACTIVE"}'
```

### GET `/users`

Query params:
- `page` (default `1`)
- `pageSize` (default `20`, max `100`)
- `role` (`VIEWER` | `ANALYST` | `ADMIN`)
- `status` (`ACTIVE` | `INACTIVE`)

```bash
curl -X GET "$BASE_URL/users?page=1&pageSize=10&role=ANALYST" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### GET `/users/:userId`

```bash
curl -X GET "$BASE_URL/users/<USER_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### PATCH `/users/:userId`

```bash
curl -X PATCH "$BASE_URL/users/<USER_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"INACTIVE"}'
```

## 4) Financial Records

### POST `/records` (ADMIN)

```bash
curl -X POST "$BASE_URL/records" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":"1250.75","type":"EXPENSE","category":"Operations","occurredOn":"2026-04-01T00:00:00.000Z","notes":"Cloud invoice"}'
```

### GET `/records` (ADMIN, ANALYST)

Query params:
- `page` (default `1`)
- `pageSize` (default `20`, max `100`)
- `type` (`INCOME` | `EXPENSE`)
- `category`
- `search`
- `dateFrom` (ISO)
- `dateTo` (ISO)
- `includeDeleted` (`true`/`false`, admin-only for `true`)

```bash
curl -X GET "$BASE_URL/records?page=1&pageSize=20&type=EXPENSE&search=cloud" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

### GET `/records/:recordId` (ADMIN, ANALYST)

```bash
curl -X GET "$BASE_URL/records/<RECORD_ID>" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

### PATCH `/records/:recordId` (ADMIN)

```bash
curl -X PATCH "$BASE_URL/records/<RECORD_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Updated invoice amount"}'
```

### DELETE `/records/:recordId` (ADMIN)

```bash
curl -X DELETE "$BASE_URL/records/<RECORD_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response: `204 No Content`

## 5) Dashboard

### GET `/dashboard/summary` (VIEWER, ANALYST, ADMIN)

Optional params: `dateFrom`, `dateTo`

```bash
curl -X GET "$BASE_URL/dashboard/summary" \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

### GET `/dashboard/trend` (VIEWER, ANALYST, ADMIN)

Query params:
- `granularity` (`monthly` | `weekly`)
- `dateFrom`, `dateTo`
- `monthsBack` (`1..36`)

```bash
curl -X GET "$BASE_URL/dashboard/trend?granularity=monthly&monthsBack=6" \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

## Optional Enhancements Included

- JWT auth
- Pagination
- Search
- Soft delete
- Rate limiting (120 requests / 60s / IP)
- Unit tests
- API docs endpoint

## Automated Live Validation

Verifies all documented APIs and RBAC behavior against the deployed API.

```bash
npm run test:live-docs-api
```

Use a different deployment:

```bash
BASE_URL="https://your-domain/api/v1" npm run test:live-docs-api
```
