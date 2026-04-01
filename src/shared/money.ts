import { BadRequestError } from "../core/errors";
import { MINOR_UNITS_PER_CURRENCY_UNIT } from "../config/constants";

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export const parseAmountToCents = (rawAmount: string): number => {
  if (!AMOUNT_PATTERN.test(rawAmount)) {
    throw new BadRequestError("Amount must be a positive decimal with up to two fraction digits");
  }

  const [wholePart, decimalPart = ""] = rawAmount.split(".");
  const normalizedDecimals = `${decimalPart}00`.slice(0, 2);
  const cents = Number(wholePart) * MINOR_UNITS_PER_CURRENCY_UNIT + Number(normalizedDecimals);

  if (!Number.isSafeInteger(cents)) {
    throw new BadRequestError("Amount is too large");
  }

  return cents;
};

export const formatCentsToAmount = (amountInCents: number): string => {
  if (!Number.isSafeInteger(amountInCents) || amountInCents < 0) {
    throw new BadRequestError("Amount in cents must be a non-negative safe integer");
  }

  const majorUnits = Math.floor(amountInCents / MINOR_UNITS_PER_CURRENCY_UNIT);
  const minorUnits = amountInCents % MINOR_UNITS_PER_CURRENCY_UNIT;

  return `${majorUnits}.${String(minorUnits).padStart(2, "0")}`;
};
