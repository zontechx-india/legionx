import "dotenv/config";
import { z } from "zod";

/**
 * Central, validated environment configuration.
 *
 * Everything the app needs from `process.env` is declared and parsed here once,
 * so the rest of the codebase can import a fully-typed `env` object instead of
 * reaching into `process.env` (which is `string | undefined` everywhere).
 *
 * Add new variables to `envSchema` as features land (JWT secrets, SMS keys,
 * S3 credentials, Razorpay keys, etc.). Keep secrets optional until the feature
 * that needs them is wired up, so local dev never breaks on a missing key.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // HTTP server
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // CORS — "*" (any origin) in dev, or a comma-separated allowlist in prod.
  CORS_ORIGIN: z.string().default("*"),

  // Database (optional for now — the base server boots without it)
  DATABASE_URL: z.string().optional(),
  // Direct (non-pooled) connection — used by Prisma CLI for migrations.
  DIRECT_URL: z.string().optional(),

  // Auth / JWT
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_ADMIN_EXPIRES_IN: z.string().default("1d"),
  JWT_CUSTOMER_EXPIRES_IN: z.string().default("30d"),

  // OTP
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

export type Env = typeof env;
