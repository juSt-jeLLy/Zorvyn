import type { Role } from "../domain/models";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export {};
