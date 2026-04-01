import { randomUUID } from "node:crypto";
import type { Database } from "sqlite";
import { Role, type UserModel, UserStatus } from "../../domain/models";

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRecordInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
}

export interface UpdateUserRecordInput {
  name?: string;
  role?: Role;
  status?: UserStatus;
}

export interface UserListFilters {
  page: number;
  pageSize: number;
  role?: Role;
  status?: UserStatus;
}

export interface UserRepository {
  create(input: CreateUserRecordInput): Promise<UserModel>;
  findById(userId: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  update(userId: string, input: UpdateUserRecordInput): Promise<UserModel>;
  list(filters: UserListFilters): Promise<{ items: UserModel[]; total: number }>;
}

// Repository Pattern: user queries are centralized and parameterized in one place.
export class SqliteUserRepository implements UserRepository {
  constructor(private readonly database: Database) {}

  async create(input: CreateUserRecordInput): Promise<UserModel> {
    const userId = randomUUID();
    const timestamp = new Date().toISOString();

    await this.database.run(
      `
        INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        input.email,
        input.name,
        input.passwordHash,
        input.role,
        input.status,
        timestamp,
        timestamp,
      ],
    );

    const createdUser = await this.findById(userId);
    if (!createdUser) {
      throw new Error(`Created user was not found: ${userId}`);
    }

    return createdUser;
  }

  async findById(userId: string): Promise<UserModel | null> {
    const row = await this.database.get<UserRow>(
      `
        SELECT id, email, name, password_hash, role, status, created_at, updated_at
        FROM users
        WHERE id = ?
      `,
      [userId],
    );

    return row ? this.toUserModel(row) : null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const row = await this.database.get<UserRow>(
      `
        SELECT id, email, name, password_hash, role, status, created_at, updated_at
        FROM users
        WHERE lower(email) = lower(?)
      `,
      [email],
    );

    return row ? this.toUserModel(row) : null;
  }

  async update(userId: string, input: UpdateUserRecordInput): Promise<UserModel> {
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    if (input.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(input.name);
    }

    if (input.role !== undefined) {
      updateFields.push("role = ?");
      updateValues.push(input.role);
    }

    if (input.status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(input.status);
    }

    updateFields.push("updated_at = ?");
    updateValues.push(new Date().toISOString());
    updateValues.push(userId);

    await this.database.run(
      `
        UPDATE users
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `,
      updateValues,
    );

    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new Error(`Updated user was not found: ${userId}`);
    }

    return updatedUser;
  }

  async list(filters: UserListFilters): Promise<{ items: UserModel[]; total: number }> {
    const whereClauseParts: string[] = [];
    const whereValues: unknown[] = [];

    if (filters.role) {
      whereClauseParts.push("role = ?");
      whereValues.push(filters.role);
    }

    if (filters.status) {
      whereClauseParts.push("status = ?");
      whereValues.push(filters.status);
    }

    const whereClause = whereClauseParts.length > 0 ? `WHERE ${whereClauseParts.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.pageSize;

    const items = await this.database.all<UserRow[]>(
      `
        SELECT id, email, name, password_hash, role, status, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...whereValues, filters.pageSize, offset],
    );

    const countResult = await this.database.get<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM users
        ${whereClause}
      `,
      whereValues,
    );

    return {
      items: items.map((item) => this.toUserModel(item)),
      total: countResult?.count ?? 0,
    };
  }

  private toUserModel(row: UserRow): UserModel {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      role: row.role as Role,
      status: row.status as UserStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
