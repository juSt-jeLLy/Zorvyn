import { z } from "zod";
import { DEFAULT_TREND_MONTH_WINDOW } from "../../config/constants";

const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be a valid ISO date string")
  .transform((value) => new Date(value));

export const dashboardSummaryQuerySchema = z.object({
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
});

export const dashboardTrendQuerySchema = z.object({
  granularity: z.enum(["monthly", "weekly"]).default("monthly"),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  monthsBack: z.coerce.number().int().min(1).max(36).default(DEFAULT_TREND_MONTH_WINDOW),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
export type DashboardTrendQuery = z.infer<typeof dashboardTrendQuerySchema>;
