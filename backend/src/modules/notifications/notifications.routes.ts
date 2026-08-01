import type { FastifyPluginAsync } from "fastify";
import { requireCustomer } from "../../package/auth/index.js";
import * as controller from "./notifications.controller.js";

/**
 * Notification routes.
 *
 * The same handlers serve customers and admins — the guard decides whose feed
 * is read (see `principalOf` in the controller), so there is exactly one
 * implementation instead of two that can drift apart.
 *
 * Mounted as:
 *   /api/v1/public/push-config      (no auth — the VAPID public key)
 *   /api/v1/notifications           (customer)
 *   /api/v1/admin/notifications     (admin, guarded by the /admin subtree)
 */

/** The VAPID public key. Public by definition — it is what browsers subscribe
 * with, and it identifies the sender rather than authorising anything. */
export const publicPushRoutes: FastifyPluginAsync = async (app) => {
  app.get("/push-config", controller.getPushConfig);
};

/** Feed + subscription endpoints shared by both surfaces. */
const feedRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", controller.listFeed);
  app.get("/unread-count", controller.getUnreadCount);
  app.post("/read-all", controller.markAllRead);
  app.post("/:id/read", controller.markRead);

  app.get("/devices", controller.listDevices);
  app.post("/subscribe", controller.subscribe);
  app.post("/unsubscribe", controller.unsubscribe);
};

export const customerNotificationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireCustomer);
  await app.register(feedRoutes);
};

export const adminNotificationRoutes: FastifyPluginAsync = async (app) => {
  await app.register(feedRoutes);
  // Broadcasts fan out to every account in an audience — rate-limited well
  // below the global ceiling so a slip can't spam the platform.
  app.post(
    "/broadcast",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    controller.broadcast,
  );
};
