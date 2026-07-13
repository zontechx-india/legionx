import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../../middleware/auth.js";
import * as controller from "./admin.auth.controller.js";

/** Admin authentication. Mounted at /api/v1/admin/auth */
export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/login", controller.login);
  app.get("/me", { preHandler: requireAdmin }, controller.me);
};
