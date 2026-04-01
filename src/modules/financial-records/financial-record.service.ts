import type { Logger } from "pino";
import type { ExecutionContext } from "../../core/execution-context";
import { Role } from "../../domain/models";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../../core/errors";
import { formatCentsToAmount, parseAmountToCents } from "../../shared/money";
import type {
  CreateFinancialRecordBody,
  ListFinancialRecordQuery,
  UpdateFinancialRecordBody,
} from "./financial-record.validation";
import type { FinancialRecordRepository, FinancialRecordWithCreator } from "./financial-record.repository";

export interface PublicFinancialRecord {
  id: string;
  amount: string;
  amountInCents: number;
  type: string;
  category: string;
  occurredOn: Date;
  notes?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export class FinancialRecordService {
  constructor(
    private readonly financialRecordRepository: FinancialRecordRepository,
    private readonly logger: Logger,
  ) {}

  async createRecord(input: CreateFinancialRecordBody, context: ExecutionContext): Promise<PublicFinancialRecord> {
    if (!context.actorUserId) {
      throw new UnauthorizedError("Authenticated actor is required to create records");
    }

    this.logger.info(
      {
        operation: "createFinancialRecord",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        type: input.type,
        category: input.category,
      },
      "Creating financial record",
    );

    const createdRecord = await this.financialRecordRepository.create({
      amountInCents: parseAmountToCents(input.amount),
      type: input.type,
      category: input.category,
      occurredOn: input.occurredOn,
      notes: input.notes,
      createdByUserId: context.actorUserId,
    });

    return this.toPublicFinancialRecord(createdRecord);
  }

  async listRecords(query: ListFinancialRecordQuery, context: ExecutionContext): Promise<{ items: PublicFinancialRecord[]; total: number }> {
    this.validateDateRange(query.dateFrom, query.dateTo);

    if (query.includeDeleted && context.actorRole !== Role.ADMIN) {
      throw new ForbiddenError("Only admins can query deleted records");
    }

    this.logger.debug(
      {
        operation: "listFinancialRecords",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        filters: query,
      },
      "Listing financial records",
    );

    const { items, total } = await this.financialRecordRepository.list(query);
    return {
      items: items.map((record) => this.toPublicFinancialRecord(record)),
      total,
    };
  }

  async getRecordById(recordId: string, context: ExecutionContext): Promise<PublicFinancialRecord> {
    this.logger.debug(
      {
        operation: "getFinancialRecordById",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        recordId,
      },
      "Fetching financial record by id",
    );

    const record = await this.financialRecordRepository.findById(recordId);
    if (!record) {
      throw new NotFoundError(`Financial record not found for id ${recordId}`);
    }

    return this.toPublicFinancialRecord(record);
  }

  async updateRecord(recordId: string, input: UpdateFinancialRecordBody, context: ExecutionContext): Promise<PublicFinancialRecord> {
    this.logger.info(
      {
        operation: "updateFinancialRecord",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        recordId,
        input,
      },
      "Updating financial record",
    );

    const existingRecord = await this.financialRecordRepository.findById(recordId, true);
    if (!existingRecord) {
      throw new NotFoundError(`Financial record not found for id ${recordId}`);
    }

    if (existingRecord.deletedAt) {
      throw new ConflictError("Cannot update a soft-deleted financial record");
    }

    const updatedRecord = await this.financialRecordRepository.update(recordId, {
      amountInCents: input.amount ? parseAmountToCents(input.amount) : undefined,
      type: input.type,
      category: input.category,
      occurredOn: input.occurredOn,
      notes: input.notes,
    });

    return this.toPublicFinancialRecord(updatedRecord);
  }

  async deleteRecord(recordId: string, context: ExecutionContext): Promise<void> {
    this.logger.info(
      {
        operation: "deleteFinancialRecord",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        recordId,
      },
      "Soft deleting financial record",
    );

    const existingRecord = await this.financialRecordRepository.findById(recordId, true);
    if (!existingRecord) {
      throw new NotFoundError(`Financial record not found for id ${recordId}`);
    }

    if (existingRecord.deletedAt) {
      throw new ConflictError("Financial record is already soft-deleted");
    }

    await this.financialRecordRepository.softDelete(recordId, new Date());
  }

  private validateDateRange(dateFrom?: Date, dateTo?: Date): void {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestError("dateFrom cannot be greater than dateTo");
    }
  }

  toPublicFinancialRecord(record: FinancialRecordWithCreator): PublicFinancialRecord {
    return {
      id: record.id,
      amount: formatCentsToAmount(record.amountInCents),
      amountInCents: record.amountInCents,
      type: record.type,
      category: record.category,
      occurredOn: record.occurredOn,
      notes: record.notes,
      deletedAt: record.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: {
        id: record.createdByUser.id,
        name: record.createdByUser.name,
        email: record.createdByUser.email,
        role: record.createdByUser.role,
      },
    };
  }
}
