/**
 * Generic auth core types — deliberately free of any domain (no Customer /
 * Order / etc.). A "principal" is just an authenticated identity; *how* it was
 * authenticated (password, OAuth, OTP) is the strategies' business.
 *
 * To reuse this package in another project, widen or change `PrincipalType`.
 */

export type PrincipalType = "admin" | "customer";

export interface Principal {
  id: string;
  type: PrincipalType;
  /** Optional role snapshot (e.g. admin role). */
  role?: string;
}

/** Request metadata captured on a session for auditing / revocation UIs. */
export interface SessionMeta {
  userAgent?: string | null;
  ip?: string | null;
}

/** What issuing / rotating a session returns. */
export interface IssuedTokens {
  principal: Principal;
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime, echoed to mobile clients (e.g. "15m"). */
  accessExpiresIn: string;
}
