export type TrendGranularity = "monthly" | "weekly";

export interface TrendBucketingStrategy {
  getBucketKey(date: Date): string;
  getBucketStartDate(bucketKey: string): Date;
}

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const toUtcDate = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

const monthlyBucketingStrategy: TrendBucketingStrategy = {
  getBucketKey(date: Date): string {
    const utcDate = toUtcDate(date);
    return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, "0")}`;
  },
  getBucketStartDate(bucketKey: string): Date {
    const [yearRaw, monthRaw] = bucketKey.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new Error(`Invalid monthly bucket key: ${bucketKey}`);
    }
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  },
};

const getStartOfWeekMondayUtc = (date: Date): Date => {
  const utcDate = toUtcDate(date);
  const dayIndex = utcDate.getUTCDay();
  const daysSinceMonday = (dayIndex + 6) % 7;
  return new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate() - daysSinceMonday));
};

const weeklyBucketingStrategy: TrendBucketingStrategy = {
  getBucketKey(date: Date): string {
    const startOfWeek = getStartOfWeekMondayUtc(date);
    return toIsoDate(startOfWeek);
  },
  getBucketStartDate(bucketKey: string): Date {
    return toUtcDate(new Date(bucketKey));
  },
};

// Strategy Pattern: allows trend aggregation algorithm to vary by granularity.
export const getTrendBucketingStrategy = (granularity: TrendGranularity): TrendBucketingStrategy => {
  if (granularity === "weekly") {
    return weeklyBucketingStrategy;
  }

  return monthlyBucketingStrategy;
};

export const getDefaultTrendDateRange = (
  monthsBack: number,
  now: Date,
): {
  startDate: Date;
  endDate: Date;
} => {
  const normalizedNow = toUtcDate(now);
  const startDate = new Date(
    Date.UTC(normalizedNow.getUTCFullYear(), normalizedNow.getUTCMonth() - (monthsBack - 1), 1, 0, 0, 0, 0),
  );

  return {
    startDate,
    endDate: normalizedNow,
  };
};
