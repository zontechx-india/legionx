import type { FastifyReply } from "fastify";
import { ok } from "../../../utils/response.js";
import { setAuthCookies, clearAuthCookies } from "./cookies.js";
import type { IssuedTokens } from "./authCore.types.js";

/**
 * Client-profile response shaping. The login/refresh controllers call one of
 * these so the *same* issued tokens are delivered the right way per surface.
 */

/** Web: set httpOnly cookies, return only the non-secret payload. */
export function deliverWeb(
  reply: FastifyReply,
  tokens: IssuedTokens,
  extra: Record<string, unknown> = {},
) {
  setAuthCookies(reply, tokens);
  return ok(extra);
}

/** Mobile: return the tokens in the JSON body for the app to store. */
export function deliverMobile(
  tokens: IssuedTokens,
  extra: Record<string, unknown> = {},
) {
  return ok({
    ...extra,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.accessExpiresIn,
  });
}

/** Web logout: wipe the auth cookies. */
export function deliverWebLogout(reply: FastifyReply) {
  clearAuthCookies(reply);
  return ok({ signedOut: true });
}
