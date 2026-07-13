import type { FastifyPluginAsync } from "fastify";
import { requireCustomer } from "../../middleware/auth.js";
import * as controller from "./auth.controller.js";

/**
 * Customer authentication + self-service. Mounted at /api/v1/auth
 *
 * Customers browse and check out as guests. To view their own profile/orders
 * they log in with an OTP sent to **either an email or a phone number**. Once
 * logged in they can link the other identifier from their profile (verified by
 * a second OTP). Each email/phone maps to exactly one account.
 */
export const authRoutes: FastifyPluginAsync = async (app) => {
  // Public — OTP login (email or phone)
  app.post("/otp/request", controller.requestOtp);
  app.post("/otp/verify", controller.verifyOtp);

  // Protected — the logged-in customer's own data
  app.get("/me", { preHandler: requireCustomer }, controller.me);
  app.patch("/me", { preHandler: requireCustomer }, controller.updateMe);
  app.get("/me/orders", { preHandler: requireCustomer }, controller.myOrders);

  // Protected — link a second identifier (email <-> phone)
  app.post("/me/link/request", { preHandler: requireCustomer }, controller.requestLink);
  app.post("/me/link/verify", { preHandler: requireCustomer }, controller.verifyLink);
};
