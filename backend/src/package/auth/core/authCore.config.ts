import { authEnv, isProduction } from "./config/env.js";
import type { PrincipalType } from "./authCore.types.js";

/**
 * Configuration for the generic auth core.
 *
 * Reads from the package's own `./config/env` — no dependency on the app's
 * `config/env`. Lifting this package into another project needs no edits here.
 */

/** Parses a duration string like "15m" / "7d" / "3600s" into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: "${value}"`);
  const n = Number(match[1]);
  const unit = match[2] as "s" | "m" | "h" | "d";
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * factor;
}

/** Refresh-token lifetime per principal kind (used for DB expiry + cookie maxAge). */
const REFRESH_TTL: Record<PrincipalType, string> = {
  admin: authEnv.JWT_ADMIN_EXPIRES_IN,
  customer: authEnv.JWT_CUSTOMER_EXPIRES_IN,
};

export const authConfig = {
  /** Access-token (JWT) lifetime — short. */
  accessTtl: authEnv.JWT_ACCESS_EXPIRES_IN,
  accessTtlMs: parseDurationMs(authEnv.JWT_ACCESS_EXPIRES_IN),

  refreshTtlMs(type: PrincipalType): number {
    return parseDurationMs(REFRESH_TTL[type]);
  },

  cookie: {
    accessName: "access_token",
    refreshName: "refresh_token",
    csrfName: "csrf_token",
    secure: authEnv.AUTH_COOKIE_SECURE ?? isProduction,
    sameSite: authEnv.AUTH_COOKIE_SAMESITE,
    domain: authEnv.AUTH_COOKIE_DOMAIN,
    path: "/",
  },
} as const;
