import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import type { Database } from "sqlite";
import { PASSWORD_SALT_ROUNDS } from "../config/constants";
import { env } from "../config/env";
import { RecordType, Role, UserStatus } from "../domain/models";
import { closeDatabase, getDatabase } from "../infrastructure/database/sqlite-client";
import { logger } from "../logging/logger";

const SAMPLE_RECORDS = [
  {
    amountInCents: 420000,
    type: RecordType.INCOME,
    category: "Salary",
    occurredOn: new Date("2026-03-01T00:00:00.000Z"),
    notes: "Monthly compensation",
  },
  {
    amountInCents: 35000,
    type: RecordType.EXPENSE,
    category: "Rent",
    occurredOn: new Date("2026-03-04T00:00:00.000Z"),
    notes: "Apartment rent",
  },
  {
    amountInCents: 9000,
    type: RecordType.EXPENSE,
    category: "Transport",
    occurredOn: new Date("2026-03-06T00:00:00.000Z"),
    notes: "Public transport pass",
  },
  {
    amountInCents: 12000,
    type: RecordType.INCOME,
    category: "Freelance",
    occurredOn: new Date("2026-03-10T00:00:00.000Z"),
    notes: "Consulting payout",
  },
  {
    amountInCents: 6400,
    type: RecordType.EXPENSE,
    category: "Groceries",
    occurredOn: new Date("2026-03-15T00:00:00.000Z"),
    notes: "Weekly groceries",
  },
] as const;

const upsertUser = async (
  database: Database,
  params: {
    email: string;
    name: string;
    role: Role;
    status: UserStatus;
    password: string;
  },
): Promise<string> => {
  const existing = await database.get<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE lower(email) = lower(?)
    `,
    [params.email],
  );

  const passwordHash = await hash(params.password, PASSWORD_SALT_ROUNDS);
  const now = new Date().toISOString();

  if (existing) {
    await database.run(
      `
        UPDATE users
        SET name = ?, role = ?, status = ?, password_hash = ?, updated_at = ?
        WHERE id = ?
      `,
      [params.name, params.role, params.status, passwordHash, now, existing.id],
    );

    return existing.id;
  }

  const userId = randomUUID();
  await database.run(
    `
      INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, params.email, params.name, passwordHash, params.role, params.status, now, now],
  );

  return userId;
};

const runSeed = async (): Promise<void> => {
  const database = await getDatabase();

  logger.info("Seeding database");

  const adminUserId = await upsertUser(database, {
    email: env.DEFAULT_ADMIN_EMAIL ?? "admin@finance.local",
    name: env.DEFAULT_ADMIN_NAME ?? "Finance Admin",
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    password: env.DEFAULT_ADMIN_PASSWORD ?? "ChangeMe123!",
  });

  await upsertUser(database, {
    email: "analyst@finance.local",
    name: "Insights Analyst",
    role: Role.ANALYST,
    status: UserStatus.ACTIVE,
    password: "AnalystPass123!",
  });

  await upsertUser(database, {
    email: "viewer@finance.local",
    name: "Dashboard Viewer",
    role: Role.VIEWER,
    status: UserStatus.ACTIVE,
    password: "ViewerPass123!",
  });

  const recordCountRow = await database.get<{ count: number }>(
    `
      SELECT COUNT(*) as count
      FROM financial_records
    `,
  );

  if ((recordCountRow?.count ?? 0) === 0) {
    const now = new Date().toISOString();
    for (const record of SAMPLE_RECORDS) {
      await database.run(
        `
          INSERT INTO financial_records
            (id, amount_in_cents, type, category, occurred_on, notes, created_by_user_id, deleted_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `,
        [
          randomUUID(),
          record.amountInCents,
          record.type,
          record.category,
          record.occurredOn.toISOString(),
          record.notes,
          adminUserId,
          now,
          now,
        ],
      );
    }
  }

  logger.info("Seeding completed");
};

void runSeed()
  .catch((error) => {
    logger.error({ err: error }, "Seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
