import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../config/constants";
import { RecordType } from "../../domain/models";

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const parseDateString = (value: string): Date => new Date(value);

const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be a valid ISO date string")
  .transform((value) => parseDateString(value));

const booleanQuerySchema = z.preprocess((value) => {
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const createFinancialRecordBodySchema = z.object({
  amount: z.string().trim().regex(AMOUNT_PATTERN, "Amount must be a positive decimal with max two decimals"),
  type: z.nativeEnum(RecordType),
  category: z.string().trim().min(2).max(60),
  occurredOn: dateStringSchema,
  notes: z.string().trim().max(500).optional(),
});

export const updateFinancialRecordBodySchema = z
  .object({
    amount: z.string().trim().regex(AMOUNT_PATTERN, "Amount must be a positive decimal with max two decimals").optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.string().trim().min(2).max(60).optional(),
    occurredOn: dateStringSchema.optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be supplied for update",
  });

export const recordIdParamSchema = z.object({
  recordId: z.string().uuid("Invalid financial record id"),
});

export const listFinancialRecordQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  type: z.nativeEnum(RecordType).optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(2).max(80).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  includeDeleted: booleanQuerySchema.optional().default(false),
});

export type CreateFinancialRecordBody = z.infer<typeof createFinancialRecordBodySchema>;
export type UpdateFinancialRecordBody = z.infer<typeof updateFinancialRecordBodySchema>;
export type ListFinancialRecordQuery = z.infer<typeof listFinancialRecordQuerySchema>;
