import type { FastifyPluginAsync } from "fastify";
import { requireCustomer } from "../../package/auth/index.js";
import * as controller from "./addresses.controller.js";

/**
 * Customer address book. Mounted at /api/v1/addresses — every route
 * requires a signed-in customer and only ever touches their own addresses.
 * Checkout reads this list to offer saved addresses as suggestions.
 */
export const addressRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireCustomer);

  app.get("/", controller.listAddresses);
  app.post("/", controller.createAddress);
  app.patch("/:addressId", controller.updateAddress);
  app.delete("/:addressId", controller.deleteAddress);
};
