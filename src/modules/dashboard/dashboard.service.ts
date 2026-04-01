import type { Logger } from "pino";
import { DEFAULT_RECENT_ACTIVITY_LIMIT } from "../../config/constants";
import { RecordType } from "../../domain/models";
import type { ExecutionContext } from "../../core/execution-context";
import { BadRequestError } from "../../core/errors";
import { formatCentsToAmount } from "../../shared/money";
import type { FinancialRecordRepository } from "../financial-records/financial-record.repository";
import type { DashboardSummaryQuery, DashboardTrendQuery } from "./dashboard.validation";
import { getDefaultTrendDateRange, getTrendBucketingStrategy } from "./trend-bucketing.strategy";

export interface DashboardSummaryResponse {
  totals: {
    incomeInCents: number;
    expenseInCents: number;
    netInCents: number;
    income: string;
    expense: string;
    net: string;
  };
  categoryTotals: Array<{
    category: string;
    incomeInCents: number;
    expenseInCents: number;
    netInCents: number;
    income: string;
    expense: string;
    net: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    category: string;
    amountInCents: number;
    amount: string;
    occurredOn: Date;
    createdBy: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
}

export interface DashboardTrendResponse {
  granularity: "monthly" | "weekly";
  startDate: Date;
  endDate: Date;
  data: Array<{
    periodStart: Date;
    incomeInCents: number;
    expenseInCents: number;
    netInCents: number;
    income: string;
    expense: string;
    net: string;
  }>;
}

export class DashboardService {
  constructor(
    private readonly financialRecordRepository: FinancialRecordRepository,
    private readonly logger: Logger,
  ) {}

  async getSummary(query: DashboardSummaryQuery, context: ExecutionContext): Promise<DashboardSummaryResponse> {
    this.validateDateRange(query.dateFrom, query.dateTo);

    this.logger.debug(
      {
        operation: "dashboardSummary",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        query,
      },
      "Building dashboard summary",
    );

    const [typeTotals, categoryTotals, recentActivity] = await Promise.all([
      this.financialRecordRepository.aggregateByType(query),
      this.financialRecordRepository.aggregateByCategory(query),
      this.financialRecordRepository.listRecent(DEFAULT_RECENT_ACTIVITY_LIMIT),
    ]);

    const totalIncomeInCents = typeTotals.find((item) => item.type === RecordType.INCOME)?.amountInCents ?? 0;
    const totalExpenseInCents = typeTotals.find((item) => item.type === RecordType.EXPENSE)?.amountInCents ?? 0;
    const totalNetInCents = totalIncomeInCents - totalExpenseInCents;

    const categoryMap = new Map<
      string,
      {
        incomeInCents: number;
        expenseInCents: number;
      }
    >();

    for (const row of categoryTotals) {
      const current = categoryMap.get(row.category) ?? { incomeInCents: 0, expenseInCents: 0 };
      if (row.type === RecordType.INCOME) {
        current.incomeInCents += row.amountInCents;
      } else {
        current.expenseInCents += row.amountInCents;
      }

      categoryMap.set(row.category, current);
    }

    return {
      totals: {
        incomeInCents: totalIncomeInCents,
        expenseInCents: totalExpenseInCents,
        netInCents: totalNetInCents,
        income: formatCentsToAmount(totalIncomeInCents),
        expense: formatCentsToAmount(totalExpenseInCents),
        net: this.formatSignedAmount(totalNetInCents),
      },
      categoryTotals: Array.from(categoryMap.entries())
        .map(([category, summary]) => {
          const netInCents = summary.incomeInCents - summary.expenseInCents;
          return {
            category,
            incomeInCents: summary.incomeInCents,
            expenseInCents: summary.expenseInCents,
            netInCents,
            income: formatCentsToAmount(summary.incomeInCents),
            expense: formatCentsToAmount(summary.expenseInCents),
            net: this.formatSignedAmount(netInCents),
          };
        })
        .sort((left, right) => right.netInCents - left.netInCents),
      recentActivity: recentActivity.map((item) => ({
        id: item.id,
        type: item.type,
        category: item.category,
        amountInCents: item.amountInCents,
        amount: formatCentsToAmount(item.amountInCents),
        occurredOn: item.occurredOn,
        createdBy: {
          id: item.createdByUser.id,
          name: item.createdByUser.name,
          email: item.createdByUser.email,
          role: item.createdByUser.role,
        },
      })),
    };
  }

  async getTrends(query: DashboardTrendQuery, context: ExecutionContext): Promise<DashboardTrendResponse> {
    const range = this.resolveDateRange(query.dateFrom, query.dateTo, query.monthsBack);
    this.validateDateRange(range.startDate, range.endDate);

    this.logger.debug(
      {
        operation: "dashboardTrend",
        requestId: context.requestId,
        actorUserId: context.actorUserId,
        granularity: query.granularity,
        range,
      },
      "Building dashboard trend",
    );

    const records = await this.financialRecordRepository.listForTrend({
      dateFrom: range.startDate,
      dateTo: range.endDate,
    });

    const strategy = getTrendBucketingStrategy(query.granularity);
    const bucketMap = new Map<
      string,
      {
        incomeInCents: number;
        expenseInCents: number;
      }
    >();

    for (const record of records) {
      const bucketKey = strategy.getBucketKey(record.occurredOn);
      const bucket = bucketMap.get(bucketKey) ?? { incomeInCents: 0, expenseInCents: 0 };

      if (record.type === RecordType.INCOME) {
        bucket.incomeInCents += record.amountInCents;
      } else {
        bucket.expenseInCents += record.amountInCents;
      }

      bucketMap.set(bucketKey, bucket);
    }

    const data = Array.from(bucketMap.entries())
      .map(([bucketKey, value]) => {
        const netInCents = value.incomeInCents - value.expenseInCents;
        return {
          periodStart: strategy.getBucketStartDate(bucketKey),
          incomeInCents: value.incomeInCents,
          expenseInCents: value.expenseInCents,
          netInCents,
          income: formatCentsToAmount(value.incomeInCents),
          expense: formatCentsToAmount(value.expenseInCents),
          net: this.formatSignedAmount(netInCents),
        };
      })
      .sort((left, right) => left.periodStart.getTime() - right.periodStart.getTime());

    return {
      granularity: query.granularity,
      startDate: range.startDate,
      endDate: range.endDate,
      data,
    };
  }

  private resolveDateRange(
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    monthsBack: number,
  ): { startDate: Date; endDate: Date } {
    if (dateFrom || dateTo) {
      return {
        startDate: dateFrom ?? new Date(0),
        endDate: dateTo ?? new Date(),
      };
    }

    return getDefaultTrendDateRange(monthsBack, new Date());
  }

  private validateDateRange(dateFrom?: Date, dateTo?: Date): void {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestError("dateFrom cannot be after dateTo");
    }
  }

  private formatSignedAmount(valueInCents: number): string {
    if (valueInCents < 0) {
      return `-${formatCentsToAmount(Math.abs(valueInCents))}`;
    }

    return formatCentsToAmount(valueInCents);
  }
}
