#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "https://finance-dashboard-api-production-6a11.up.railway.app/api/v1";

const DEMO_USERS = {
  admin: { email: "admin@finance.local", password: "ChangeMe123!" },
  analyst: { email: "analyst@finance.local", password: "AnalystPass123!" },
  viewer: { email: "viewer@finance.local", password: "ViewerPass123!" },
};

const toJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const assertStatus = async (label, response, expectedStatuses) => {
  const accepted = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  if (accepted.includes(response.status)) {
    console.log(`PASS ${label} -> ${response.status}`);
    return;
  }

  const payload = await toJson(response);
  throw new Error(
    `FAIL ${label} -> expected ${accepted.join("/")}, got ${response.status}. Payload: ${JSON.stringify(payload)}`,
  );
};

const login = async ({ email, password }) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  await assertStatus(`login:${email}`, response, 200);
  const payload = await toJson(response);
  return payload.data.accessToken;
};

const authenticatedFetch = async (token, path, options = {}) => {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
};

const run = async () => {
  console.log(`Using BASE_URL=${BASE_URL}`);

  const healthResponse = await fetch(`${BASE_URL}/health`);
  await assertStatus("health", healthResponse, 200);

  const docsResponse = await fetch(`${BASE_URL}/docs`);
  await assertStatus("docs", docsResponse, 200);

  const adminToken = await login(DEMO_USERS.admin);
  const analystToken = await login(DEMO_USERS.analyst);
  const viewerToken = await login(DEMO_USERS.viewer);

  const uniqueSuffix = Date.now();
  const userEmail = `api.verify.${uniqueSuffix}@example.com`;

  const createUserResponse = await authenticatedFetch(adminToken, "/users", {
    method: "POST",
    body: JSON.stringify({
      name: "API Verify User",
      email: userEmail,
      password: "StrongPass123!",
      role: "ANALYST",
      status: "ACTIVE",
    }),
  });
  await assertStatus("users:create(admin)", createUserResponse, 201);
  const createdUserPayload = await toJson(createUserResponse);
  const createdUserId = createdUserPayload.data.id;

  const listUsersResponse = await authenticatedFetch(adminToken, "/users?page=1&pageSize=10");
  await assertStatus("users:list(admin)", listUsersResponse, 200);

  const getUserResponse = await authenticatedFetch(adminToken, `/users/${createdUserId}`);
  await assertStatus("users:get(admin)", getUserResponse, 200);

  const updateUserResponse = await authenticatedFetch(adminToken, `/users/${createdUserId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "INACTIVE" }),
  });
  await assertStatus("users:update(admin)", updateUserResponse, 200);

  const createUserForbidden = await authenticatedFetch(analystToken, "/users", {
    method: "POST",
    body: JSON.stringify({
      name: "Should Fail",
      email: `forbidden.${uniqueSuffix}@example.com`,
      password: "StrongPass123!",
      role: "VIEWER",
      status: "ACTIVE",
    }),
  });
  await assertStatus("users:create(analyst forbidden)", createUserForbidden, 403);

  const recordCreateResponse = await authenticatedFetch(adminToken, "/records", {
    method: "POST",
    body: JSON.stringify({
      amount: "99.99",
      type: "EXPENSE",
      category: "API Verification",
      occurredOn: new Date().toISOString(),
      notes: "created by verify-live-api",
    }),
  });
  await assertStatus("records:create(admin)", recordCreateResponse, 201);
  const createdRecordPayload = await toJson(recordCreateResponse);
  const createdRecordId = createdRecordPayload.data.id;

  const recordsListAnalyst = await authenticatedFetch(
    analystToken,
    "/records?page=1&pageSize=5&type=EXPENSE&search=verify",
  );
  await assertStatus("records:list(analyst)", recordsListAnalyst, 200);

  const recordsListViewerForbidden = await authenticatedFetch(viewerToken, "/records?page=1&pageSize=5");
  await assertStatus("records:list(viewer forbidden)", recordsListViewerForbidden, 403);

  const getRecordResponse = await authenticatedFetch(analystToken, `/records/${createdRecordId}`);
  await assertStatus("records:get(analyst)", getRecordResponse, 200);

  const updateRecordResponse = await authenticatedFetch(adminToken, `/records/${createdRecordId}`, {
    method: "PATCH",
    body: JSON.stringify({ notes: "updated by verify-live-api" }),
  });
  await assertStatus("records:update(admin)", updateRecordResponse, 200);

  const deleteRecordResponse = await authenticatedFetch(adminToken, `/records/${createdRecordId}`, {
    method: "DELETE",
  });
  await assertStatus("records:delete(admin)", deleteRecordResponse, 204);

  const includeDeletedByAdmin = await authenticatedFetch(adminToken, "/records?page=1&pageSize=5&includeDeleted=true");
  await assertStatus("records:list includeDeleted(admin)", includeDeletedByAdmin, 200);

  const includeDeletedByAnalystForbidden = await authenticatedFetch(
    analystToken,
    "/records?page=1&pageSize=5&includeDeleted=true",
  );
  await assertStatus("records:list includeDeleted(analyst forbidden)", includeDeletedByAnalystForbidden, 403);

  const dashboardSummaryViewer = await authenticatedFetch(viewerToken, "/dashboard/summary");
  await assertStatus("dashboard:summary(viewer)", dashboardSummaryViewer, 200);

  const dashboardTrendViewer = await authenticatedFetch(viewerToken, "/dashboard/trend?granularity=monthly&monthsBack=6");
  await assertStatus("dashboard:trend(viewer)", dashboardTrendViewer, 200);

  console.log("All documented API checks passed.");
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
