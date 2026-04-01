import { compare } from "bcryptjs";
import type { Logger } from "pino";
import { env } from "../../config/env";
import { UserStatus, type Role } from "../../domain/models";
import type { ExecutionContext } from "../../core/execution-context";
import { UnauthorizedError } from "../../core/errors";
import type { UserService } from "../users/user.service";
import type { LoginBody } from "./auth.validation";
import { TokenService } from "./token.service";

export interface LoginResponse {
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly logger: Logger,
  ) {}

  async login(input: LoginBody, context: ExecutionContext): Promise<LoginResponse> {
    this.logger.info(
      {
        operation: "login",
        requestId: context.requestId,
        email: input.email,
      },
      "Authentication attempt",
    );

    const user = await this.userService.getUserWithPasswordByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("User account is inactive");
    }

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      role: user.role,
    });

    return {
      tokenType: "Bearer",
      accessToken,
      expiresIn: env.JWT_EXPIRES_IN,
      user: this.userService.toPublicUser(user),
    };
  }

  verifyAccessToken(token: string): { userId: string; role: Role } {
    const payload = this.tokenService.verifyAccessToken(token);
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
