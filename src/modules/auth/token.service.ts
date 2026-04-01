import jwt, { type SignOptions } from "jsonwebtoken";
import type { Logger } from "pino";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../core/errors";
import { Role } from "../../domain/models";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export class TokenService {
  constructor(private readonly logger: Logger) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decodedPayload = jwt.verify(token, env.JWT_SECRET);
      if (typeof decodedPayload !== "object" || decodedPayload === null) {
        throw new UnauthorizedError("Invalid authentication token payload");
      }

      if (typeof decodedPayload.sub !== "string" || typeof decodedPayload.role !== "string") {
        throw new UnauthorizedError("Authentication token payload is incomplete");
      }

      if (!Object.values(Role).includes(decodedPayload.role as Role)) {
        throw new UnauthorizedError("Authentication token role is invalid");
      }

      return {
        sub: decodedPayload.sub,
        role: decodedPayload.role as Role,
      };
    } catch (error) {
      this.logger.warn({ err: error }, "Token verification failed");
      throw new UnauthorizedError("Invalid or expired authentication token");
    }
  }
}
