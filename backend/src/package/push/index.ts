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

/**
 * Pick the driver, degrading to the console on ANY initialisation failure.
 *
 * Push is an optional feature; a malformed key or subject must never stop the
 * API from booting. `web-push` validates its VAPID details eagerly and throws,
 * and this module is imported at startup — without this guard a stray
 * character in `.env` crash-loops the whole server (which is exactly what it
 * did once). Failing loudly but *softly* keeps orders flowing while making the
 * misconfiguration obvious in the logs.
 */
function selectDriver(): PushSender {
  if (!pushConfig.configured) return createConsolePushDriver();
  try {
    return createWebPushDriver();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "⚠️  Web Push is misconfigured — falling back to console delivery.",
      err,
    );
    return createConsolePushDriver();
  }
}

export const push: PushSender = selectDriver();

/** Handed to clients so they can call `pushManager.subscribe()`. */
export const pushPublicKey = push.publicKey;

/** False = console fallback; clients use it to explain why push is off. */
export const pushConfigured = push.configured;
