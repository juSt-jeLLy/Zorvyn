import type { RequestHandler } from "express";
import { asyncHandler } from "../../core/async-handler";
import { ForbiddenError, UnauthorizedError } from "../../core/errors";
import { Role } from "../../domain/models";
import type { UserService } from "../users/user.service";
import type { AuthService } from "./auth.service";

export interface AuthGuards {
  requireAuthenticatedUser: RequestHandler;
  requireRoles: (...allowedRoles: Role[]) => RequestHandler;
}

export const createAuthGuards = (authService: AuthService, userService: UserService): AuthGuards => {
  const requireAuthenticatedUser = asyncHandler(async (req, _res, next) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new UnauthorizedError("Authorization header is required");
    }

    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Authorization header must use Bearer token");
    }

    const verifiedPayload = authService.verifyAccessToken(token);
    const authenticatedUser = await userService.getActiveUserForAuthentication(verifiedPayload.userId);

    req.auth = {
      userId: authenticatedUser.id,
      role: authenticatedUser.role,
    };

    next();
  });

  const requireRoles = (...allowedRoles: Role[]): RequestHandler => {
    return (req, _res, next) => {
      if (!req.auth) {
        next(new UnauthorizedError("Authentication is required"));
        return;
      }

      if (!allowedRoles.includes(req.auth.role)) {
        next(
          new ForbiddenError(
            `Insufficient role. Required one of: ${allowedRoles.join(", ")}, current role: ${req.auth.role}`,
          ),
        );
        return;
      }

      next();
    };
  };

  return {
    requireAuthenticatedUser,
    requireRoles,
  };
};
