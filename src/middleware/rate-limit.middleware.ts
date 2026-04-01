import rateLimit from "express-rate-limit";

const ONE_MINUTE_IN_MS = 60_000;
const RATE_LIMIT_REQUEST_CAP = 120;

export const apiRateLimiter = rateLimit({
  windowMs: ONE_MINUTE_IN_MS,
  limit: RATE_LIMIT_REQUEST_CAP,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded, please retry shortly",
    },
  },
});
