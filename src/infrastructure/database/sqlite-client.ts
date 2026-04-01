import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { dirname } from "node:path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import { env } from "../../config/env";
import { logger } from "../../logging/logger";
import { initializeSchema } from "./schema";

let databaseInstance: Database | null = null;

export const getDatabase = async (): Promise<Database> => {
  if (databaseInstance) {
    return databaseInstance;
  }

  const databasePath = resolve(process.cwd(), env.DATA_FILE_PATH);
  await mkdir(dirname(databasePath), { recursive: true });
  const database = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  await initializeSchema(database);

  logger.info({ databasePath }, "SQLite database connected");

  databaseInstance = database;
  return databaseInstance;
};

export const closeDatabase = async (): Promise<void> => {
  if (!databaseInstance) {
    return;
  }

  await databaseInstance.close();
  databaseInstance = null;
};
