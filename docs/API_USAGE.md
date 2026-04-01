# Finance Dashboard API Documentation

## Live API

- Base URL: `https://finance-dashboard-api-production-6a11.up.railway.app/api/v1`
- OpenAPI JSON: `GET /docs`

## Authentication

This API uses JWT bearer tokens.

1. Login using `POST /auth/login`.
2. Read `data.accessToken` from response.
3. Pass token as header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## Default Demo Users

- Admin: `admin@finance.local` / `ChangeMe123!`
- Analyst: `analyst@finance.local` / `AnalystPass123!`
- Viewer: `viewer@finance.local` / `ViewerPass123!`

## Role Access Matrix

- `VIEWER`
  - Can access: dashboard APIs
- `ANALYST`
  - Can access: dashboard APIs, record read/list APIs
- `ADMIN`
  - Full access: users, records (create/update/delete), dashboard

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

## Endpoints

## 1) Health and Docs

### GET `/health`

Public health check.

```bash
curl -X GET "$BASE_URL/health"
```

### GET `/docs`

Returns OpenAPI JSON summary.

```bash
curl -X GET "$BASE_URL/docs"
```

## 2) Auth

### POST `/auth/login`

Login and receive JWT token.

Request body:

```json
{
  "email": "admin@finance.local",
  "password": "ChangeMe123!"
}
```

Curl:

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.local","password":"ChangeMe123!"}'
```

Success response includes token and user profile.

## 3) Users (ADMIN only)

## POST `/users`

Create a user.

Request body:

```json
{
  "name": "Alice Analyst",
  "email": "alice@example.com",
  "password": "StrongPass123!",
  "role": "ANALYST",
  "status": "ACTIVE"
}
```

Curl:

```bash
curl -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Analyst","email":"alice@example.com","password":"StrongPass123!","role":"ANALYST","status":"ACTIVE"}'
```

## GET `/users`

List users with pagination/filters.

Query params:
- `page` (default `1`)
- `pageSize` (default `20`, max `100`)
- `role` (`VIEWER` | `ANALYST` | `ADMIN`)
- `status` (`ACTIVE` | `INACTIVE`)

Curl:

```bash
curl -X GET "$BASE_URL/users?page=1&pageSize=10&role=ANALYST" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## GET `/users/:userId`

Get single user by UUID.

```bash
curl -X GET "$BASE_URL/users/<USER_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## PATCH `/users/:userId`

Update user fields.

Request body (any one or more fields):

```json
{
  "name": "Alice Updated",
  "role": "VIEWER",
  "status": "INACTIVE"
}
```

Curl:

```bash
curl -X PATCH "$BASE_URL/users/<USER_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"INACTIVE"}'
```

## 4) Financial Records

## POST `/records` (ADMIN)

Create a financial record.

Request body:

```json
{
  "amount": "1250.75",
  "type": "EXPENSE",
  "category": "Operations",
  "occurredOn": "2026-04-01T00:00:00.000Z",
  "notes": "Cloud invoice"
}
```

Curl:

```bash
curl -X POST "$BASE_URL/records" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":"1250.75","type":"EXPENSE","category":"Operations","occurredOn":"2026-04-01T00:00:00.000Z","notes":"Cloud invoice"}'
```

## GET `/records` (ADMIN, ANALYST)

List records with pagination, filters, and search.

Query params:
- `page` (default `1`)
- `pageSize` (default `20`, max `100`)
- `type` (`INCOME` | `EXPENSE`)
- `category` (exact category match, case-insensitive)
- `search` (contains match in `category` or `notes`, min 2 chars)
- `dateFrom` (ISO datetime)
- `dateTo` (ISO datetime)
- `includeDeleted` (`true`/`false`, only ADMIN allowed to use `true`)

Curl:

```bash
curl -X GET "$BASE_URL/records?page=1&pageSize=20&type=EXPENSE&search=cloud" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

## GET `/records/:recordId` (ADMIN, ANALYST)

Get a record by UUID.

```bash
curl -X GET "$BASE_URL/records/<RECORD_ID>" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

## PATCH `/records/:recordId` (ADMIN)

Update record fields.

Request body example:

```json
{
  "amount": "1300.00",
  "notes": "Updated invoice amount"
}
```

```bash
curl -X PATCH "$BASE_URL/records/<RECORD_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Updated invoice amount"}'
```

## DELETE `/records/:recordId` (ADMIN)

Soft delete a record.

```bash
curl -X DELETE "$BASE_URL/records/<RECORD_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response: `204 No Content`

## 5) Dashboard

## GET `/dashboard/summary` (VIEWER, ANALYST, ADMIN)

Returns:
- total income
- total expenses
- net
- category-wise totals
- recent activity

Optional query params:
- `dateFrom` (ISO datetime)
- `dateTo` (ISO datetime)

```bash
curl -X GET "$BASE_URL/dashboard/summary" \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

## GET `/dashboard/trend` (VIEWER, ANALYST, ADMIN)

Returns trend buckets.

Query params:
- `granularity` (`monthly` | `weekly`, default `monthly`)
- `dateFrom` (ISO datetime, optional)
- `dateTo` (ISO datetime, optional)
- `monthsBack` (`1..36`, default `6`) used when explicit date range not supplied

```bash
curl -X GET "$BASE_URL/dashboard/trend?granularity=monthly&monthsBack=6" \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

## Rate Limits

- Global rate limit is enabled.
- Current config: 120 requests / 60 seconds per IP.
- Exceeded requests return HTTP `429`.

## Quick Start Script

```bash
BASE_URL="https://finance-dashboard-api-production-6a11.up.railway.app/api/v1"

ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.local","password":"ChangeMe123!"}' | jq -r '.data.accessToken')

curl -s "$BASE_URL/users?page=1&pageSize=5" -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Automated Docs Conformance Test

This runs a live end-to-end validation of all documented APIs, including RBAC checks.

```bash
npm run test:live-docs-api
```

Optionally target a different deployment:

```bash
BASE_URL="https://your-deployment.example.com/api/v1" npm run test:live-docs-api
```
