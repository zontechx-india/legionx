import { pushConfig } from "./config.js";
import { createConsolePushDriver } from "./drivers/console.js";
import { createWebPushDriver } from "./drivers/webPush.js";
import type { PushSender } from "./types.js";

/**
 * PUBLIC facade of the push package — the only file the app imports.
 *
 * Provides the active `push` sender (real Web Push when VAPID keys are
 * configured, a console logger otherwise) and the VAPID public key browsers
 * need in order to subscribe.
 *
 * The package is deliberately domain-free: it knows an endpoint and a
 * payload, never a customer, an order, or the database. Storing
 * subscriptions, deciding who gets what, and writing the notification feed
 * all belong to `modules/notifications`.
 */

export type {
  PushPayload,
  PushResult,
  PushSender,
  PushStatus,
  PushTarget,
} from "./types.js";

export const push: PushSender = pushConfig.configured
  ? createWebPushDriver()
  : createConsolePushDriver();

/** Handed to clients so they can call `pushManager.subscribe()`. */
export const pushPublicKey = push.publicKey;

/** False = console fallback; clients use it to explain why push is off. */
export const pushConfigured = push.configured;
