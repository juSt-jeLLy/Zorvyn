import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { createContainer } from "./container";
import { closeDatabase } from "./infrastructure/database/sqlite-client";
import { logger } from "./logging/logger";

const bootstrap = async (): Promise<void> => {
  const container = await createContainer();
  const app = createApp(container);
  const server = createServer(app);
  let isShuttingDown = false;

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Finance dashboard backend started");
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.info({ signal }, "Graceful shutdown started");
    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, "Error while closing HTTP server");
      }

      await closeDatabase();
      logger.info("SQLite disconnected");
      process.exit(error ? 1 : 0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

void bootstrap().catch(async (error) => {
  logger.error({ err: error }, "Fatal startup error");
  await closeDatabase();
  process.exit(1);
});
