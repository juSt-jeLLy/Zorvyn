import { describe, expect, it } from "vitest";
import { parseAmountToCents, formatCentsToAmount } from "../shared/money";

describe("money helpers", () => {
  it("converts major amount to cents", () => {
    // Arrange
    const input = "123.45";

    // Act
    const result = parseAmountToCents(input);

    // Assert
    expect(result).toBe(12345);
  });

  it("formats cents to major amount", () => {
    // Arrange
    const input = 9025;

    // Act
    const result = formatCentsToAmount(input);

    // Assert
    expect(result).toBe("90.25");
  });

  it("throws for invalid decimal", () => {
    // Arrange
    const input = "-1.00";

    // Act + Assert
    expect(() => parseAmountToCents(input)).toThrowError();
  });
});
