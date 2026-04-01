import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";
import { ValidationError } from "../core/errors";

type SupportedSchema = ZodTypeAny;

type RequestSegment = "body" | "query" | "params";

export const validateRequest = (schema: SupportedSchema, segment: RequestSegment): RequestHandler => {
  return (req, _res, next) => {
    try {
      const parsedValue = schema.parse(req[segment] as unknown);
      if (segment === "body") {
        req.body = parsedValue;
      } else if (segment === "params") {
        Object.assign(req.params, parsedValue as Record<string, string>);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError("Input validation failed", {
            issues: error.issues,
          }),
        );
        return;
      }

      next(error);
    }
  };
};
