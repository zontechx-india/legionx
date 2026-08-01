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

/**
 * The cookie namespace of one principal kind.
 *
 * **Why cookie names are per-principal, not global.** The admin console and
 * the storefront are two apps on ONE origin, and a browser keys cookies by
 * `(name, domain, path)` — the **port is not part of that key**. With a single
 * shared set of names, signing in on one surface silently overwrote the
 * other's tokens: the second login evicted the first session, the evicted
 * app then sent the wrong principal's token (403), its refresh rotated a
 * token of the wrong kind and failed, and a logout revoked whichever session
 * happened to own the cookie. Giving each principal its own namespace lets
 * both sessions coexist, which is the normal case for staff who also sell or
 * shop on the platform.
 *
 * Adding a third principal kind later is one entry in `COOKIE_SURFACES` —
 * nothing else in the package needs to know it exists.
 */
export interface AuthCookieSurface {
  access: string;
  refresh: string;
  csrf: string;
  /**
   * Path for the two **httpOnly** cookies. Narrowing it to the surface's own
   * API subtree means the admin's tokens are never even transmitted with a
   * storefront request — defence in depth on top of the distinct names.
   */
  tokenPath: string;
}

const COOKIE_SURFACES: Record<PrincipalType, AuthCookieSurface> = {
  // The customer surface keeps the ORIGINAL, unprefixed names and root path.
  // Renaming them would invalidate every signed-in customer's cookies on
  // deploy; the collision is fixed by moving the *admin* out of this
  // namespace, which costs only the admins a single re-login.
  customer: {
    access: "access_token",
    refresh: "refresh_token",
    csrf: "csrf_token",
    tokenPath: "/",
  },
  admin: {
    access: "um_admin_access",
    refresh: "um_admin_refresh",
    csrf: "um_admin_csrf",
    tokenPath: "/api/v1/admin",
  },
};

export const authConfig = {
  /** Access-token (JWT) lifetime — short. */
  accessTtl: authEnv.JWT_ACCESS_EXPIRES_IN,
  accessTtlMs: parseDurationMs(authEnv.JWT_ACCESS_EXPIRES_IN),

  refreshTtlMs(type: PrincipalType): number {
    return parseDurationMs(REFRESH_TTL[type]);
  },

  /** The cookie namespace for a principal kind. */
  cookieSurface(type: PrincipalType): AuthCookieSurface {
    return COOKIE_SURFACES[type];
  },

  cookie: {
    secure: authEnv.AUTH_COOKIE_SECURE ?? isProduction,
    sameSite: authEnv.AUTH_COOKIE_SAMESITE,
    domain: authEnv.AUTH_COOKIE_DOMAIN,
    /**
     * The CSRF cookie is readable by JS on purpose (double-submit), so it must
     * live at a path the **document** matches — the admin SPA is served from
     * `/admin`, which does not match `/api/v1/admin`. It stays at the root and
     * relies on its per-surface NAME for isolation. That is safe: the CSRF
     * token is not a credential, and its protection comes from an attacker
     * being unable to read it cross-origin.
     */
    csrfPath: "/",
  },
} as const;
