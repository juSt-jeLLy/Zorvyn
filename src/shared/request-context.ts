import type { Request } from "express";
import type { ExecutionContext } from "../core/execution-context";

export const buildExecutionContext = (request: Request): ExecutionContext => {
  return {
    requestId: request.requestId,
    actorUserId: request.auth?.userId,
    actorRole: request.auth?.role,
  };
};
