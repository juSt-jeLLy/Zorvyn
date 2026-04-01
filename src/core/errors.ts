export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    statusCode: number;
    code: AppErrorCode;
    isOperational?: boolean;
    details?: unknown;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.isOperational = params.isOperational ?? true;
    this.details = params.details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 400, code: "BAD_REQUEST", details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required") {
    super({ message, statusCode: 401, code: "UNAUTHORIZED" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super({ message, statusCode: 403, code: "FORBIDDEN" });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super({ message, statusCode: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super({ message, statusCode: 409, code: "CONFLICT" });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 422, code: "VALIDATION_ERROR", details });
  }
}
