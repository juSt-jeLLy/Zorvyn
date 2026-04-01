#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_URL = process.env.BASE_URL || "https://finance-dashboard-api-production-6a11.up.railway.app/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@finance.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const loadDemoData = async () => {
  const filePath = resolve(process.cwd(), "data/demo-data.json");
  const rawData = await readFile(filePath, "utf8");
  const parsedData = JSON.parse(rawData);

  if (typeof parsedData.tag !== "string" || !Array.isArray(parsedData.records)) {
    throw new Error("Invalid demo-data.json format");
  }

  return {
    tag: parsedData.tag,
    records: parsedData.records,
  };
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
  const demoData = await loadDemoData();
  const demoTag = demoData.tag;

  const adminToken = await login();

  const existingResponse = await fetch(
    `${BASE_URL}/records?page=1&pageSize=100&type=INCOME&search=${encodeURIComponent(demoTag)}`,
    {
      headers: { authorization: `Bearer ${adminToken}` },
    },
  );

  const existingIncomePayload = await toJson(existingResponse);
  if (existingResponse.status !== 200) {
    throw new Error(`Unable to fetch existing income demo records: ${JSON.stringify(existingIncomePayload)}`);
  }

  const existingExpenseResponse = await fetch(
    `${BASE_URL}/records?page=1&pageSize=100&type=EXPENSE&search=${encodeURIComponent(demoTag)}`,
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

  for (const record of demoData.records) {
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
  console.log(`Use search=${demoTag} in /records to fetch demo entries.`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
