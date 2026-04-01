import { randomUUID } from "node:crypto";
import type { Database } from "sqlite";
import { RecordType, type Role } from "../../domain/models";

interface FinancialRecordRow {
  id: string;
  amount_in_cents: number;
  type: string;
  category: string;
  occurred_on: string;
  notes: string | null;
  created_by_user_id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  created_by_email: string;
  created_by_role: string;
}

interface TrendRow {
  occurred_on: string;
  type: string;
  amount_in_cents: number;
}

export interface FinancialRecordWithCreator {
  id: string;
  amountInCents: number;
  type: RecordType;
  category: string;
  occurredOn: Date;
  notes: string | null;
  createdByUserId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface CreateFinancialRecordInput {
  amountInCents: number;
  type: RecordType;
  category: string;
  occurredOn: Date;
  notes?: string;
  createdByUserId: string;
}

export interface UpdateFinancialRecordInput {
  amountInCents?: number;
  type?: RecordType;
  category?: string;
  occurredOn?: Date;
  notes?: string;
}

export interface FinancialRecordFilters {
  page: number;
  pageSize: number;
  type?: RecordType;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeDeleted?: boolean;
  search?: string;
}

export interface AggregateFilters {
  type?: RecordType;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface FinancialRecordRepository {
  create(input: CreateFinancialRecordInput): Promise<FinancialRecordWithCreator>;
  findById(recordId: string, includeDeleted?: boolean): Promise<FinancialRecordWithCreator | null>;
  list(filters: FinancialRecordFilters): Promise<{ items: FinancialRecordWithCreator[]; total: number }>;
  update(recordId: string, input: UpdateFinancialRecordInput): Promise<FinancialRecordWithCreator>;
  softDelete(recordId: string, deletedAt: Date): Promise<FinancialRecordWithCreator>;
  aggregateByType(filters?: AggregateFilters): Promise<Array<{ type: RecordType; amountInCents: number }>>;
  aggregateByCategory(filters?: AggregateFilters): Promise<Array<{ category: string; type: RecordType; amountInCents: number }>>;
  listRecent(limit: number): Promise<FinancialRecordWithCreator[]>;
  listForTrend(filters: AggregateFilters): Promise<Array<{ occurredOn: Date; type: RecordType; amountInCents: number }>>;
}

// Repository Pattern: consolidates SQL access and shields business logic from query details.
export class SqliteFinancialRecordRepository implements FinancialRecordRepository {
  constructor(private readonly database: Database) {}

  async create(input: CreateFinancialRecordInput): Promise<FinancialRecordWithCreator> {
    const recordId = randomUUID();
    const timestamp = new Date().toISOString();

    await this.database.run(
      `
        INSERT INTO financial_records
          (id, amount_in_cents, type, category, occurred_on, notes, created_by_user_id, deleted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
      `,
      [
        recordId,
        input.amountInCents,
        input.type,
        input.category,
        input.occurredOn.toISOString(),
        input.notes ?? null,
        input.createdByUserId,
        timestamp,
        timestamp,
      ],
    );

    const createdRecord = await this.findById(recordId, true);
    if (!createdRecord) {
      throw new Error(`Created record was not found: ${recordId}`);
    }

    return createdRecord;
  }

  async findById(recordId: string, includeDeleted = false): Promise<FinancialRecordWithCreator | null> {
    const row = await this.database.get<FinancialRecordRow>(
      `
        SELECT
          fr.id,
          fr.amount_in_cents,
          fr.type,
          fr.category,
          fr.occurred_on,
          fr.notes,
          fr.created_by_user_id,
          fr.deleted_at,
          fr.created_at,
          fr.updated_at,
          u.name AS created_by_name,
          u.email AS created_by_email,
          u.role AS created_by_role
        FROM financial_records fr
        JOIN users u ON u.id = fr.created_by_user_id
        WHERE fr.id = ?
        ${includeDeleted ? "" : "AND fr.deleted_at IS NULL"}
      `,
      [recordId],
    );

    return row ? this.toFinancialRecordWithCreator(row) : null;
  }

  async list(filters: FinancialRecordFilters): Promise<{ items: FinancialRecordWithCreator[]; total: number }> {
    const where = this.buildWhereClause(filters, filters.includeDeleted ?? false);
    const offset = (filters.page - 1) * filters.pageSize;

    const rows = await this.database.all<FinancialRecordRow[]>(
      `
        SELECT
          fr.id,
          fr.amount_in_cents,
          fr.type,
          fr.category,
          fr.occurred_on,
          fr.notes,
          fr.created_by_user_id,
          fr.deleted_at,
          fr.created_at,
          fr.updated_at,
          u.name AS created_by_name,
          u.email AS created_by_email,
          u.role AS created_by_role
        FROM financial_records fr
        JOIN users u ON u.id = fr.created_by_user_id
        ${where.clause}
        ORDER BY fr.occurred_on DESC, fr.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...where.values, filters.pageSize, offset],
    );

    const countRow = await this.database.get<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM financial_records fr
        ${where.clause}
      `,
      where.values,
    );

    return {
      items: rows.map((row) => this.toFinancialRecordWithCreator(row)),
      total: countRow?.count ?? 0,
    };
  }

  async update(recordId: string, input: UpdateFinancialRecordInput): Promise<FinancialRecordWithCreator> {
    const updateFields: string[] = [];
    const values: unknown[] = [];

    if (input.amountInCents !== undefined) {
      updateFields.push("amount_in_cents = ?");
      values.push(input.amountInCents);
    }

    if (input.type !== undefined) {
      updateFields.push("type = ?");
      values.push(input.type);
    }

    if (input.category !== undefined) {
      updateFields.push("category = ?");
      values.push(input.category);
    }

    if (input.occurredOn !== undefined) {
      updateFields.push("occurred_on = ?");
      values.push(input.occurredOn.toISOString());
    }

    if (input.notes !== undefined) {
      updateFields.push("notes = ?");
      values.push(input.notes);
    }

    updateFields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(recordId);

    await this.database.run(
      `
        UPDATE financial_records
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `,
      values,
    );

    const updatedRecord = await this.findById(recordId, true);
    if (!updatedRecord) {
      throw new Error(`Updated record was not found: ${recordId}`);
    }

    return updatedRecord;
  }

  async softDelete(recordId: string, deletedAt: Date): Promise<FinancialRecordWithCreator> {
    await this.database.run(
      `
        UPDATE financial_records
        SET deleted_at = ?, updated_at = ?
        WHERE id = ?
      `,
      [deletedAt.toISOString(), new Date().toISOString(), recordId],
    );

    const deletedRecord = await this.findById(recordId, true);
    if (!deletedRecord) {
      throw new Error(`Soft-deleted record was not found: ${recordId}`);
    }

    return deletedRecord;
  }

  async aggregateByType(filters: AggregateFilters = {}): Promise<Array<{ type: RecordType; amountInCents: number }>> {
    const where = this.buildWhereClause(filters, false);

    const rows = await this.database.all<Array<{ type: string; amount_in_cents: number }>>(
      `
        SELECT type, COALESCE(SUM(amount_in_cents), 0) AS amount_in_cents
        FROM financial_records fr
        ${where.clause}
        GROUP BY type
      `,
      where.values,
    );

    return rows.map((row) => ({
      type: row.type as RecordType,
      amountInCents: row.amount_in_cents ?? 0,
    }));
  }

  async aggregateByCategory(
    filters: AggregateFilters = {},
  ): Promise<Array<{ category: string; type: RecordType; amountInCents: number }>> {
    const where = this.buildWhereClause(filters, false);

    const rows = await this.database.all<Array<{ category: string; type: string; amount_in_cents: number }>>(
      `
        SELECT category, type, COALESCE(SUM(amount_in_cents), 0) AS amount_in_cents
        FROM financial_records fr
        ${where.clause}
        GROUP BY category, type
      `,
      where.values,
    );

    return rows.map((row) => ({
      category: row.category,
      type: row.type as RecordType,
      amountInCents: row.amount_in_cents ?? 0,
    }));
  }

  async listRecent(limit: number): Promise<FinancialRecordWithCreator[]> {
    const rows = await this.database.all<FinancialRecordRow[]>(
      `
        SELECT
          fr.id,
          fr.amount_in_cents,
          fr.type,
          fr.category,
          fr.occurred_on,
          fr.notes,
          fr.created_by_user_id,
          fr.deleted_at,
          fr.created_at,
          fr.updated_at,
          u.name AS created_by_name,
          u.email AS created_by_email,
          u.role AS created_by_role
        FROM financial_records fr
        JOIN users u ON u.id = fr.created_by_user_id
        WHERE fr.deleted_at IS NULL
        ORDER BY fr.occurred_on DESC, fr.created_at DESC
        LIMIT ?
      `,
      [limit],
    );

    return rows.map((row) => this.toFinancialRecordWithCreator(row));
  }

  async listForTrend(filters: AggregateFilters): Promise<Array<{ occurredOn: Date; type: RecordType; amountInCents: number }>> {
    const where = this.buildWhereClause(filters, false);

    const rows = await this.database.all<TrendRow[]>(
      `
        SELECT occurred_on, type, amount_in_cents
        FROM financial_records fr
        ${where.clause}
        ORDER BY occurred_on ASC
      `,
      where.values,
    );

    return rows.map((row) => ({
      occurredOn: new Date(row.occurred_on),
      type: row.type as RecordType,
      amountInCents: row.amount_in_cents,
    }));
  }

  private buildWhereClause(
    filters: AggregateFilters | FinancialRecordFilters,
    includeDeleted: boolean,
  ): { clause: string; values: unknown[] } {
    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (!includeDeleted) {
      whereParts.push("fr.deleted_at IS NULL");
    }

    if (filters.type) {
      whereParts.push("fr.type = ?");
      values.push(filters.type);
    }

    if (filters.category) {
      whereParts.push("lower(fr.category) = lower(?)");
      values.push(filters.category);
    }

    if (filters.dateFrom) {
      whereParts.push("fr.occurred_on >= ?");
      values.push(filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      whereParts.push("fr.occurred_on <= ?");
      values.push(filters.dateTo.toISOString());
    }

    if ("search" in filters && typeof filters.search === "string" && filters.search.trim().length > 0) {
      whereParts.push("(lower(fr.category) LIKE lower(?) OR lower(COALESCE(fr.notes, '')) LIKE lower(?))");
      values.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`);
    }

    return {
      clause: whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "",
      values,
    };
  }

  private toFinancialRecordWithCreator(row: FinancialRecordRow): FinancialRecordWithCreator {
    return {
      id: row.id,
      amountInCents: row.amount_in_cents,
      type: row.type as RecordType,
      category: row.category,
      occurredOn: new Date(row.occurred_on),
      notes: row.notes,
      createdByUserId: row.created_by_user_id,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdByUser: {
        id: row.created_by_user_id,
        name: row.created_by_name,
        email: row.created_by_email,
        role: row.created_by_role as Role,
      },
    };
  }
}
