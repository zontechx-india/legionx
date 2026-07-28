import "dotenv/config";
import { z } from "zod";

/**
 * Auth package's **own** environment — only the variables this package needs.
 *
 * Kept inside the package (not the app's `config/env`) so the whole folder is
 * self-contained: copy `package/auth/` into another project and its config
 * comes with it. The app's `config/env` carries no auth vars at all.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Access token (JWT) — short-lived.
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  // Refresh-token lifetimes per principal kind (opaque, DB-backed, rotating).
  JWT_ADMIN_EXPIRES_IN: z.string().default("7d"),
  JWT_CUSTOMER_EXPIRES_IN: z.string().default("30d"),

  // Web-client cookies.
  AUTH_COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  AUTH_COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  AUTH_COOKIE_DOMAIN: z.string().optional(),

  // Verification codes (phone OTP login, email verification, password reset).
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  // Dev/testing: skip real code generation + delivery and accept OTP_DEV_CODE.
  // Defaults to on outside production; never defaults on in production.
  OTP_BYPASS: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  OTP_DEV_CODE: z.string().default("123456"),

  // Email delivery — Resend (live). When RESEND_API_KEY is set the registry
  // selects the Resend sender; without it, codes fall back to the console
  // stub. EMAIL_FROM must be an address on the Resend-verified domain.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("connect@zontechx.com"),

  // SMS OTP — Message Central (managed verification: they generate, deliver,
  // and check the code; we store only their verificationId). When both
  // credentials are set the registry selects it; without them, the console
  // fallback logs a locally-generated code.
  MESSAGE_CENTRAL_CUSTOMER_ID: z.string().optional(),
  MESSAGE_CENTRAL_AUTH_TOKEN: z.string().optional(),
  MESSAGE_CENTRAL_SEND_URL: z
    .string()
    .default("https://cpaas.messagecentral.com/verification/v3/send"),
  MESSAGE_CENTRAL_VERIFY_URL: z
    .string()
    .default("https://cpaas.messagecentral.com/verification/v3/validateOtp"),
  SMS_COUNTRY_CODE: z.string().default("91"),

  // OAuth — consumed by the *real* verifiers once wired (the current mock
  // Google verifier ignores them). Optional so local dev never breaks.
  GOOGLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid auth environment variables:");
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

export const authEnv = parsed.data;
export const isProduction = authEnv.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Production fail-fast guards — refuse to boot with dev-only auth settings.
// ---------------------------------------------------------------------------
if (isProduction) {
  const problems: string[] = [];
  if (authEnv.OTP_BYPASS === true) {
    // The bypass accepts the fixed OTP_DEV_CODE for ANY phone number — in
    // production that is an account-takeover hole, never a convenience.
    problems.push("OTP_BYPASS must not be enabled in production");
  }
  if (authEnv.AUTH_COOKIE_SECURE === false) {
    problems.push(
      "AUTH_COOKIE_SECURE=false is not allowed in production (session cookies must be HTTPS-only)",
    );
  }
  if (authEnv.JWT_SECRET.length < 32) {
    problems.push(
      "JWT_SECRET must be at least 32 characters in production (use a long random string)",
    );
  }
  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error("❌ Unsafe production auth configuration:");
    for (const problem of problems) {
      // eslint-disable-next-line no-console
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }
}
