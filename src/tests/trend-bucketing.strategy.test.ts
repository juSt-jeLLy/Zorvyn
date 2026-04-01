import { describe, expect, it } from "vitest";
import { getDefaultTrendDateRange, getTrendBucketingStrategy } from "../modules/dashboard/trend-bucketing.strategy";

describe("trend bucketing strategy", () => {
  it("returns month key for monthly strategy", () => {
    // Arrange
    const strategy = getTrendBucketingStrategy("monthly");
    const date = new Date("2026-03-11T12:00:00.000Z");

    // Act
    const bucketKey = strategy.getBucketKey(date);

    // Assert
    expect(bucketKey).toBe("2026-03");
  });

  it("returns monday key for weekly strategy", () => {
    // Arrange
    const strategy = getTrendBucketingStrategy("weekly");
    const date = new Date("2026-03-11T12:00:00.000Z"); // Wednesday

    // Act
    const bucketKey = strategy.getBucketKey(date);

    // Assert
    expect(bucketKey).toBe("2026-03-09");
  });

  it("computes default date range", () => {
    // Arrange
    const now = new Date("2026-04-01T00:00:00.000Z");

    // Act
    const range = getDefaultTrendDateRange(6, now);

    // Assert
    expect(range.startDate.toISOString()).toBe("2025-11-01T00:00:00.000Z");
    expect(range.endDate.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});
