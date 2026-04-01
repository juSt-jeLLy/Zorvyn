import cors from "cors";
import express from "express";
import helmet from "helmet";
import { API_PREFIX } from "./config/constants";
import type { AppContainer } from "./container";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiRateLimiter } from "./middleware/rate-limit.middleware";
import { attachRequestContext, requestLogger } from "./middleware/request-logging.middleware";
import { buildApiRouter } from "./routes";

export const createApp = (container: AppContainer): express.Express => {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestLogger);
  app.use(attachRequestContext);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(apiRateLimiter);

  app.use(API_PREFIX, buildApiRouter(container));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
