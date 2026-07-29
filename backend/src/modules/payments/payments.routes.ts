import type { FastifyPluginAsync } from "fastify";
import * as controller from "./payments.controller.js";

/**
 * Cashfree webhook — mounted at /api/v1/payments. No auth guard (Cashfree is
 * the caller; authenticity comes from the HMAC signature check) and no rate
 * limit (a burst of retries after our downtime must drain, not 429).
 *
 * This plugin scope replaces the JSON body parser with a raw-buffer parser:
 * the signature is HMAC(timestamp + raw bytes), so the handler must see the
 * body exactly as Cashfree sent it. Encapsulation keeps every other route's
 * JSON parsing untouched.
 */
export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_request, body, done) => done(null, body),
  );

  app.post(
    "/webhooks/cashfree",
    { config: { rateLimit: false } },
    controller.handleCashfreeWebhook,
  );
};
