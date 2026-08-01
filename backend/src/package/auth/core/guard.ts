import type { FastifyRequest } from "fastify";
import { HttpError } from "../../../utils/httpError.js";
import { verifyAccessToken } from "./token.util.js";
import type { AuthenticatedPrincipal } from "./token.util.js";
import { readAccessCookie } from "./cookies.js";
import type { PrincipalType } from "./authCore.types.js";

/**
 * Access-token authentication that works for **both** client profiles:
 *   - mobile → `Authorization: Bearer <access>`
 *   - web    → the surface's own httpOnly access cookie
 *
 * The `type` argument selects which surface's cookie to read. A bearer token
 * needs no such hint (the JWT carries its own principal type, and
 * `verifyAccessToken` + the caller's check enforce it), so the header path
 * stays type-agnostic.
 */

/** Pulls the access token from the Authorization header or the cookie. */
export function extractAccessToken(
  request: FastifyRequest,
  type: PrincipalType,
): string | undefined {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  return readAccessCookie(request, type);
}

/** Verifies the request and returns the principal, or throws 401. */
export function authenticate(
  request: FastifyRequest,
  type: PrincipalType,
): AuthenticatedPrincipal {
  const token = extractAccessToken(request, type);
  if (!token) throw HttpError.unauthorized("Authentication required");
  return verifyAccessToken(token);
}

/**
 * Route-guard factory: requires a valid access token of the given kind and
 * attaches the principal to the request (`request.admin` / `request.customer`).
 */
export function requirePrincipal(type: PrincipalType) {
  return async function guard(request: FastifyRequest): Promise<void> {
    const principal = authenticate(request, type);
    if (principal.type !== type) {
      throw HttpError.forbidden(`${type} access required`);
    }
    if (type === "admin") {
      request.admin = {
        id: principal.id,
        role: principal.role ?? "",
        ...(principal.sessionId ? { sessionId: principal.sessionId } : {}),
      };
    } else {
      request.customer = {
        id: principal.id,
        ...(principal.sessionId ? { sessionId: principal.sessionId } : {}),
      };
    }
  };
}
