import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { CookieSerializeOptions } from "@fastify/cookie";
import { HttpError } from "../../../utils/httpError.js";
import { authConfig } from "./authCore.config.js";
import { generateRefreshToken } from "./token.util.js";
import type { IssuedTokens } from "./authCore.types.js";

/**
 * Web-client token delivery via cookies.
 *   - access + refresh → httpOnly cookies (JS can't read them; XSS-safe).
 *   - csrf → a readable cookie the SPA echoes back in the `X-CSRF-Token`
 *     header (double-submit) so cookie auth is CSRF-safe.
 */

function baseOptions(): CookieSerializeOptions {
  const c = authConfig.cookie;
  return {
    secure: c.secure,
    sameSite: c.sameSite,
    path: c.path,
    ...(c.domain ? { domain: c.domain } : {}),
  };
}

export function setAuthCookies(reply: FastifyReply, tokens: IssuedTokens): void {
  const c = authConfig.cookie;
  const refreshMaxAge = Math.floor(
    authConfig.refreshTtlMs(tokens.principal.type) / 1000,
  );

  reply.setCookie(c.accessName, tokens.accessToken, {
    ...baseOptions(),
    httpOnly: true,
    maxAge: Math.floor(authConfig.accessTtlMs / 1000),
  });
  reply.setCookie(c.refreshName, tokens.refreshToken, {
    ...baseOptions(),
    httpOnly: true,
    maxAge: refreshMaxAge,
  });
  // Readable by the SPA → sent back in the X-CSRF-Token header.
  reply.setCookie(c.csrfName, generateRefreshToken(), {
    ...baseOptions(),
    httpOnly: false,
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  const c = authConfig.cookie;
  const opts = baseOptions();
  reply.clearCookie(c.accessName, opts);
  reply.clearCookie(c.refreshName, opts);
  reply.clearCookie(c.csrfName, opts);
}

export function readAccessCookie(request: FastifyRequest): string | undefined {
  return request.cookies[authConfig.cookie.accessName];
}

export function readRefreshCookie(request: FastifyRequest): string | undefined {
  return request.cookies[authConfig.cookie.refreshName];
}

/** Metadata captured on the session from the request. */
export function sessionMeta(request: FastifyRequest): {
  userAgent: string | null;
  ip: string | null;
} {
  return {
    userAgent: request.headers["user-agent"] ?? null,
    ip: request.ip ?? null,
  };
}

/** Constant-time string equality (hash first so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

/** Double-submit CSRF guard for cookie-authenticated mutations. */
export async function requireCsrf(request: FastifyRequest): Promise<void> {
  const cookie = request.cookies[authConfig.cookie.csrfName];
  const header = request.headers["x-csrf-token"];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!cookie || !provided || !safeEqual(cookie, provided)) {
    throw HttpError.forbidden("Invalid or missing CSRF token");
  }
}
