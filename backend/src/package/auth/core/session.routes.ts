import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ok } from "../../../utils/response.js";
import { HttpError } from "../../../utils/httpError.js";
import {
  rotateSession,
  revokeSession,
  revokeAllSessions,
} from "./session.service.js";
import { readRefreshCookie, sessionMeta, requireCsrf } from "./cookies.js";
import { deliverWeb, deliverMobile, deliverWebLogout } from "./delivery.js";
import { requirePrincipal } from "./guard.js";
import type { PrincipalType } from "./authCore.types.js";

/**
 * Generic session endpoints — identical for every principal kind, so they are
 * mounted once per surface. `expectType` pins the surface (a customer refresh
 * token can't be rotated on the admin subtree, and vice-versa).
 *
 *   Web    → POST /web/refresh · /web/logout · /web/logout-all   (cookies + CSRF)
 *   Mobile → POST /mobile/refresh · /mobile/logout · /mobile/logout-all (bearer)
 */
export function sessionRoutes(expectType: PrincipalType): FastifyPluginAsync {
  const bodyRefresh = z.object({ refreshToken: z.string().min(1) });

  return async (app) => {
    // ---- Web (cookies) --------------------------------------------------
    app.post(
      "/web/refresh",
      { preHandler: requireCsrf },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const token = readRefreshCookie(request);
        if (!token) throw HttpError.unauthorized("Missing refresh cookie");
        const tokens = await rotateSession(token, sessionMeta(request), expectType);
        return deliverWeb(reply, tokens);
      },
    );

    app.post("/web/logout", async (request, reply) => {
      const token = readRefreshCookie(request);
      if (token) await revokeSession(token);
      return deliverWebLogout(reply);
    });

    app.post(
      "/web/logout-all",
      { preHandler: requirePrincipal(expectType) },
      async (request, reply) => {
        const principal =
          expectType === "admin" ? request.admin : request.customer;
        if (!principal) throw HttpError.unauthorized();
        await revokeAllSessions(principal.id, expectType);
        return deliverWebLogout(reply);
      },
    );

    // ---- Mobile (bearer) ------------------------------------------------
    app.post("/mobile/refresh", async (request) => {
      const { refreshToken } = bodyRefresh.parse(request.body);
      const tokens = await rotateSession(
        refreshToken,
        sessionMeta(request),
        expectType,
      );
      return deliverMobile(tokens);
    });

    app.post("/mobile/logout", async (request) => {
      const { refreshToken } = bodyRefresh.parse(request.body);
      await revokeSession(refreshToken);
      return ok({ signedOut: true });
    });

    app.post(
      "/mobile/logout-all",
      { preHandler: requirePrincipal(expectType) },
      async (request) => {
        const principal =
          expectType === "admin" ? request.admin : request.customer;
        if (!principal) throw HttpError.unauthorized();
        const count = await revokeAllSessions(principal.id, expectType);
        return ok({ signedOut: true, revoked: count });
      },
    );
  };
}
