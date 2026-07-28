import type { FastifyPluginAsync } from "fastify";
import * as controller from "./discovery.controller.js";

/**
 * Marketplace discovery — anonymous, read-only, platform-wide.
 * Mounted at /api/v1/public (alongside /public/stores).
 */
export const publicDiscoveryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/search", controller.search);
  app.get("/products", controller.newProducts);
  app.get("/categories", controller.popularCategories);
  app.get("/stats", controller.stats);
};
