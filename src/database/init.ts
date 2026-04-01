import "dotenv/config";
import { closeDatabase, getDatabase } from "../infrastructure/database/sqlite-client";
import { logger } from "../logging/logger";

const initialize = async (): Promise<void> => {
  await getDatabase();
  logger.info("Database initialized successfully");
};

void initialize()
  .catch((error) => {
    logger.error({ err: error }, "Database initialization failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
