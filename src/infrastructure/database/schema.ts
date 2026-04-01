import type { Database } from "sqlite";

export const initializeSchema = async (database: Database): Promise<void> => {
  await database.exec("PRAGMA foreign_keys = ON;");

  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('VIEWER', 'ANALYST', 'ADMIN')),
      status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      amount_in_cents INTEGER NOT NULL CHECK (amount_in_cents >= 0),
      type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
      category TEXT NOT NULL,
      occurred_on TEXT NOT NULL,
      notes TEXT,
      created_by_user_id TEXT NOT NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_financial_records_category ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_financial_records_occurred_on ON financial_records(occurred_on);
    CREATE INDEX IF NOT EXISTS idx_financial_records_deleted_at ON financial_records(deleted_at);
  `);
};
