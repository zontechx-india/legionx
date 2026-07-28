import { prisma } from "./config/prisma.js";
import { HttpError } from "../../../utils/httpError.js";
import { authConfig } from "./authCore.config.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "./token.util.js";
import type {
  Principal,
  PrincipalType,
  SessionMeta,
  IssuedTokens,
} from "./authCore.types.js";

/**
 * DB-backed rotating refresh sessions.
 *
 * Each login creates a session row holding the SHA-256 of an opaque refresh
 * token. On refresh the token is rotated: the old row is revoked and points to
 * the new one (`replacedById`). Presenting an already-rotated (revoked) token
 * signals theft → every session for that principal is revoked.
 */

function expiryFor(type: PrincipalType): Date {
  return new Date(Date.now() + authConfig.refreshTtlMs(type));
}

function principalFromRow(row: {
  principalId: string;
  principalType: string;
  role: string | null;
}): Principal {
  const principal: Principal = {
    id: row.principalId,
    type: row.principalType as PrincipalType,
  };
  if (row.role) principal.role = row.role;
  return principal;
}

async function mint(
  principal: Principal,
  meta: SessionMeta,
): Promise<{ refreshToken: string; sessionId: string }> {
  // Opportunistic housekeeping: drop this principal's long-expired sessions
  // so the table never grows unboundedly (an expired token would be rejected
  // anyway, so deleting the rows changes no behaviour). Indexed on
  // (principalId, principalType) — one cheap delete per login.
  await prisma.authSession.deleteMany({
    where: {
      principalId: principal.id,
      principalType: principal.type,
      expiresAt: { lt: new Date() },
    },
  });

  const refreshToken = generateRefreshToken();
  const session = await prisma.authSession.create({
    data: {
      principalId: principal.id,
      principalType: principal.type,
      role: principal.role ?? null,
      refreshHash: hashRefreshToken(refreshToken),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      expiresAt: expiryFor(principal.type),
    },
    select: { id: true },
  });
  return { refreshToken, sessionId: session.id };
}

/** Creates a brand-new session (login) and returns access + refresh tokens. */
export async function issueSession(
  principal: Principal,
  meta: SessionMeta = {},
): Promise<IssuedTokens> {
  const { refreshToken, sessionId } = await mint(principal, meta);
  return {
    principal,
    accessToken: signAccessToken(principal, sessionId),
    refreshToken,
    accessExpiresIn: authConfig.accessTtl,
  };
}

/** Rotates a refresh token, returning a fresh access + refresh pair. */
export async function rotateSession(
  presentedRefresh: string,
  meta: SessionMeta = {},
  expectType?: PrincipalType,
): Promise<IssuedTokens> {
  const row = await prisma.authSession.findUnique({
    where: { refreshHash: hashRefreshToken(presentedRefresh) },
  });
  if (!row) throw HttpError.unauthorized("Invalid refresh token");

  // Reuse of an already-rotated token → likely theft. Burn everything.
  if (row.revokedAt) {
    await revokeAllSessions(row.principalId, row.principalType as PrincipalType);
    throw HttpError.unauthorized(
      "Refresh token reuse detected — all sessions revoked. Please sign in again.",
    );
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    throw HttpError.unauthorized("Refresh token expired. Please sign in again.");
  }

  const principal = principalFromRow(row);
  if (expectType && principal.type !== expectType) {
    throw HttpError.forbidden(`${expectType} session required`);
  }

  const { refreshToken, sessionId } = await mint(principal, meta);
  await prisma.authSession.update({
    where: { id: row.id },
    data: { revokedAt: new Date(), replacedById: sessionId, lastUsedAt: new Date() },
  });

  return {
    principal,
    accessToken: signAccessToken(principal, sessionId),
    refreshToken,
    accessExpiresIn: authConfig.accessTtl,
  };
}

/** Revokes the single session tied to a refresh token (logout). */
export async function revokeSession(presentedRefresh: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { refreshHash: hashRefreshToken(presentedRefresh), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revokes every active session for a principal EXCEPT the one given —
 * used after a password change, so stolen/old sessions die while the
 * device that proved the current password stays signed in. Falls back to
 * revoking everything when no session id is known (tokens minted before
 * session binding), which is the safe direction.
 */
export async function revokeOtherSessions(
  principalId: string,
  principalType: PrincipalType,
  keepSessionId?: string,
): Promise<number> {
  const { count } = await prisma.authSession.updateMany({
    where: {
      principalId,
      principalType,
      revokedAt: null,
      ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
  return count;
}

/** Revokes every active session for a principal (logout-all / breach). */
export async function revokeAllSessions(
  principalId: string,
  principalType: PrincipalType,
): Promise<number> {
  const { count } = await prisma.authSession.updateMany({
    where: { principalId, principalType, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}
