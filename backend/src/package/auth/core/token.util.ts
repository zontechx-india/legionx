import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { authEnv } from "./config/env.js";
import { HttpError } from "../../../utils/httpError.js";
import { authConfig } from "./authCore.config.js";
import type { Principal, PrincipalType } from "./authCore.types.js";

/**
 * Token primitives.
 *   - Access token: a short-lived signed JWT carrying the principal.
 *   - Refresh token: an opaque random string; only its SHA-256 is stored.
 */

interface AccessPayload {
  type: PrincipalType;
  role?: string;
  /** The AuthSession row this token was minted under (session binding). */
  sid?: string;
}

/**
 * Issuer/audience pin the token to this service — a JWT signed for another
 * system (even one sharing the secret by mistake) is rejected outright.
 */
const JWT_ISSUER = "uniemax-auth";
const JWT_AUDIENCE = "uniemax-api";

/** The verified identity a request carries: who + which session minted it. */
export interface AuthenticatedPrincipal extends Principal {
  /** Absent only on tokens minted before session binding shipped. */
  sessionId?: string;
}

/** Signs a short-lived access JWT for the given principal. */
export function signAccessToken(principal: Principal, sessionId?: string): string {
  const payload: AccessPayload = { type: principal.type };
  if (principal.role) payload.role = principal.role;
  if (sessionId) payload.sid = sessionId;

  const options: SignOptions = {
    subject: principal.id,
    expiresIn: authConfig.accessTtl as NonNullable<SignOptions["expiresIn"]>,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
  return jwt.sign(payload, authEnv.JWT_SECRET, options);
}

/** Verifies an access JWT and returns the principal, or throws 401. */
export function verifyAccessToken(token: string): AuthenticatedPrincipal {
  try {
    const decoded = jwt.verify(token, authEnv.JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !("type" in decoded)
    ) {
      throw HttpError.unauthorized("Invalid token");
    }
    const claims = decoded as jwt.JwtPayload & AccessPayload;
    const principal: AuthenticatedPrincipal = {
      id: claims.sub as string,
      type: claims.type,
    };
    if (claims.role) principal.role = claims.role;
    if (claims.sid) principal.sessionId = claims.sid;
    return principal;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw HttpError.unauthorized("Invalid or expired token");
  }
}

/** Generates a new opaque refresh token (URL-safe). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

/** Hashes a refresh token for storage / lookup (never store the raw token). */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
