import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../guards.js";
import { sessionRoutes } from "../core/session.routes.js";
import * as controller from "./admin.controller.js";

/**
 * Admin authentication. Mounted at /api/v1/admin/auth
 *
 * Email + password only. Two client profiles from one credential check:
 *   Web    → POST /web/login      (sets httpOnly cookies)
 *   Mobile → POST /mobile/login   (returns access + refresh tokens)
 * plus the generic session endpoints (refresh / logout / logout-all) for each.
 */
/** Brute-force cap on the credential check (per IP). */
const VERIFY = { rateLimit: { max: 10, timeWindow: "1 minute" } };

export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/web/login", { config: VERIFY }, controller.webLogin);
  app.post("/mobile/login", { config: VERIFY }, controller.mobileLogin);

  await app.register(sessionRoutes("admin"));

  app.get("/me", { preHandler: requireAdmin }, controller.me);
};
