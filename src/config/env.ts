import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATA_FILE_PATH: z.string().min(1).default("./data/store.json"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(2).default("8h"),
  DEFAULT_ADMIN_EMAIL: z.string().email().optional(),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).optional(),
  DEFAULT_ADMIN_NAME: z.string().min(2).max(80).optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  // Fail fast: configuration errors are programmer or deployment issues.
  throw new Error(`Invalid environment configuration: ${parseResult.error.message}`);
}

export const env = parseResult.data;
