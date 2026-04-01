import { hash } from "bcryptjs";
import type { Logger } from "pino";
import { PASSWORD_SALT_ROUNDS } from "../../config/constants";
import { UserStatus, type UserModel } from "../../domain/models";
import type { ExecutionContext } from "../../core/execution-context";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../core/errors";
import type { CreateUserBody, UpdateUserBody, UserListQuery } from "./user.validation";
import type { CreateUserRecordInput, UserRepository } from "./user.repository";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserModel["role"];
  status: UserModel["status"];
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async createUser(input: CreateUserBody, context: ExecutionContext): Promise<PublicUser> {
    this.logger.info(
      {
        operation: "createUser",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        email: input.email,
        role: input.role,
      },
      "Creating user",
    );

    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError(`User already exists with email ${input.email}`);
    }

    const passwordHash = await hash(input.password, PASSWORD_SALT_ROUNDS);
    const createdUser = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      status: input.status,
    });

    return this.toPublicUser(createdUser);
  }

  async listUsers(filters: UserListQuery, context: ExecutionContext): Promise<{ items: PublicUser[]; total: number }> {
    this.logger.debug(
      {
        operation: "listUsers",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        filters,
      },
      "Listing users",
    );

    const { items, total } = await this.userRepository.list(filters);
    return {
      items: items.map((user) => this.toPublicUser(user)),
      total,
    };
  }

  async getUserById(userId: string, context: ExecutionContext): Promise<PublicUser> {
    this.logger.debug(
      {
        operation: "getUserById",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        userId,
      },
      "Fetching user by id",
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User not found for id ${userId}`);
    }

    return this.toPublicUser(user);
  }

  async updateUser(userId: string, input: UpdateUserBody, context: ExecutionContext): Promise<PublicUser> {
    this.logger.info(
      {
        operation: "updateUser",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        userId,
        input,
      },
      "Updating user",
    );

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError(`User not found for id ${userId}`);
    }

    const updatedUser = await this.userRepository.update(userId, {
      name: input.name,
      role: input.role,
      status: input.status,
    });

    return this.toPublicUser(updatedUser);
  }

  async getActiveUserForAuthentication(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("Invalid authentication token");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("User account is inactive");
    }

    return this.toPublicUser(user);
  }

  async getUserWithPasswordByEmail(email: string): Promise<UserModel | null> {
    return this.userRepository.findByEmail(email);
  }

  async ensureUserDoesNotExist(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      throw new ConflictError(`User already exists with email ${email}`);
    }
  }

  async createUserFromPreHashedInput(input: CreateUserRecordInput): Promise<PublicUser> {
    await this.ensureUserDoesNotExist(input.email);
    const createdUser = await this.userRepository.create(input);
    return this.toPublicUser(createdUser);
  }

  toPublicUser(user: UserModel): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
