import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../core/errors";
import { logger } from "../logging/logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError({ message: `Route not found: ${req.method} ${req.originalUrl}`, statusCode: 404, code: "NOT_FOUND" }));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const isAppError = error instanceof AppError;

  if (!isAppError) {
    logger.error(
      {
        requestId: req.requestId,
        err: error,
      },
      "Unhandled programmer error",
    );
  }

  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : "INTERNAL_ERROR";
  const message = isAppError ? error.message : "An unexpected error occurred";

  res.status(statusCode).json({
    error: {
      code,
      message,
      requestId: req.requestId,
      details: isAppError ? error.details : undefined,
    },
  });
};
