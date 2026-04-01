import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import type { RequestHandler } from "express";
import { logger } from "../logging/logger";

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const incomingRequestId = req.headers["x-request-id"];
    if (typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0) {
      return incomingRequestId;
    }

    return randomUUID();
  },
  customProps: (req) => ({ requestId: String(req.id) }),
  customSuccessMessage: () => "Request completed",
  customErrorMessage: () => "Request errored",
});

export const attachRequestContext: RequestHandler = (req, res, next) => {
  req.requestId = String((req as RequestWithId).id);
  res.setHeader("x-request-id", req.requestId);
  next();
};

type RequestWithId = {
  id?: string;
};
