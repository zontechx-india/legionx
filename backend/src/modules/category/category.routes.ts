import type { FastifyPluginAsync } from "fastify";
import * as controller from "./category.controller.js";

/** Customer-facing category browsing. Mounted at /api/v1/categories */
export const publicCategoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", controller.publicListCategories);
  app.get("/:slug", controller.publicGetCategory);
};

/**
 * Admin category management. Mounted at /api/v1/admin/categories
 * NOTE: auth guard (admin JWT) will be attached here once the auth module
 * lands — every route in this plugin should then require an admin.
 */
export const adminCategoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", controller.adminListCategories);
  app.post("/", controller.adminCreateCategory);
  app.get("/:id", controller.adminGetCategory);
  app.patch("/:id", controller.adminUpdateCategory);
  app.delete("/:id", controller.adminDeleteCategory);
};
