import type { FastifyPluginAsync } from "fastify";
import * as controller from "./product.controller.js";

/** Customer-facing product browsing. Mounted at /api/v1/products */
export const publicProductRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", controller.publicListProducts);
  app.get("/:slug", controller.publicGetProduct);
};

/**
 * Admin product management. Mounted at /api/v1/admin/products
 * NOTE: admin JWT guard attaches here once the auth module lands.
 */
export const adminProductRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", controller.adminListProducts);
  app.post("/", controller.adminCreateProduct);
  app.get("/:id", controller.adminGetProduct);
  app.patch("/:id", controller.adminUpdateProduct);
  app.delete("/:id", controller.adminDeleteProduct);
};
