#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "https://finance-dashboard-api-production-6a11.up.railway.app/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@finance.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const DEMO_TAG = "PUBLIC_DEMO_V1";

const DEMO_RECORDS = [
  {
    key: "income_salary",
    amount: "5000.00",
    type: "INCOME",
    category: "Salary",
    occurredOn: "2026-01-05T00:00:00.000Z",
    notes: `${DEMO_TAG}::income_salary`,
  },
  {
    key: "income_freelance",
    amount: "850.00",
    type: "INCOME",
    category: "Freelance",
    occurredOn: "2026-01-18T00:00:00.000Z",
    notes: `${DEMO_TAG}::income_freelance`,
  },
  {
    key: "expense_rent",
    amount: "1800.00",
    type: "EXPENSE",
    category: "Rent",
    occurredOn: "2026-01-02T00:00:00.000Z",
    notes: `${DEMO_TAG}::expense_rent`,
  },
  {
    key: "expense_groceries",
    amount: "320.50",
    type: "EXPENSE",
    category: "Groceries",
    occurredOn: "2026-01-10T00:00:00.000Z",
    notes: `${DEMO_TAG}::expense_groceries`,
  },
  {
    key: "expense_transport",
    amount: "140.25",
    type: "EXPENSE",
    category: "Transport",
    occurredOn: "2026-01-21T00:00:00.000Z",
    notes: `${DEMO_TAG}::expense_transport`,
  },
  {
    key: "income_bonus",
    amount: "1200.00",
    type: "INCOME",
    category: "Bonus",
    occurredOn: "2026-02-03T00:00:00.000Z",
    notes: `${DEMO_TAG}::income_bonus`,
  },
];

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

const login = async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const payload = await toJson(response);
  if (response.status !== 200) {
    throw new Error(`Login failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  return payload.data.accessToken;
};

const run = async () => {
  const adminToken = await login();

  const existingResponse = await fetch(
    `${BASE_URL}/records?page=1&pageSize=100&type=INCOME&search=${encodeURIComponent(DEMO_TAG)}`,
    {
      headers: { authorization: `Bearer ${adminToken}` },
    },
  );

  const existingIncomePayload = await toJson(existingResponse);
  if (existingResponse.status !== 200) {
    throw new Error(`Unable to fetch existing income demo records: ${JSON.stringify(existingIncomePayload)}`);
  }

  const existingExpenseResponse = await fetch(
    `${BASE_URL}/records?page=1&pageSize=100&type=EXPENSE&search=${encodeURIComponent(DEMO_TAG)}`,
    {
      headers: { authorization: `Bearer ${adminToken}` },
    },
  );

  const existingExpensePayload = await toJson(existingExpenseResponse);
  if (existingExpenseResponse.status !== 200) {
    throw new Error(`Unable to fetch existing expense demo records: ${JSON.stringify(existingExpensePayload)}`);
  }

  const existingNotes = new Set(
    [...(existingIncomePayload.data ?? []), ...(existingExpensePayload.data ?? [])]
      .map((record) => record.notes)
      .filter((value) => typeof value === "string"),
  );

  let createdCount = 0;

  for (const record of DEMO_RECORDS) {
    if (existingNotes.has(record.notes)) {
      console.log(`SKIP ${record.key} (already exists)`);
      continue;
    }

    const createResponse = await fetch(`${BASE_URL}/records`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(record),
    });

    const createPayload = await toJson(createResponse);
    if (createResponse.status !== 201) {
      throw new Error(`Failed creating ${record.key}: ${JSON.stringify(createPayload)}`);
    }

    createdCount += 1;
    console.log(`CREATE ${record.key} -> ${createPayload.data.id}`);
  }

  const summaryResponse = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  const summaryPayload = await toJson(summaryResponse);

  if (summaryResponse.status !== 200) {
    throw new Error(`Summary fetch failed after seeding: ${JSON.stringify(summaryPayload)}`);
  }

  console.log(`Demo seed complete. created=${createdCount}`);
  console.log(`Summary totals: ${JSON.stringify(summaryPayload.data.totals)}`);
  console.log(`Use search=${DEMO_TAG} in /records to fetch demo entries.`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
