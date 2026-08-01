import webpush from "web-push";
import { pushConfig } from "../config.js";
import type { PushSender, PushPayload, PushResult, PushTarget } from "../types.js";

/**
 * Real Web Push delivery (RFC 8291 payload encryption + RFC 8292 VAPID),
 * handled by the `web-push` library. Active whenever both VAPID keys are set.
 */
export function createWebPushDriver(): PushSender {
  webpush.setVapidDetails(
    pushConfig.subject,
    pushConfig.publicKey!,
    pushConfig.privateKey!,
  );

  return {
    publicKey: pushConfig.publicKey,
    configured: true,

    async send(target: PushTarget, payload: PushPayload): Promise<PushResult> {
      try {
        await webpush.sendNotification(
          {
            endpoint: target.endpoint,
            keys: { p256dh: target.p256dh, auth: target.auth },
          },
          JSON.stringify(payload),
          { TTL: pushConfig.ttlSeconds },
        );
        return { status: "sent" };
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 404/410 = the browser dropped this subscription for good. Anything
        // else (429, 5xx, network) may succeed next time.
        const permanent = statusCode === 404 || statusCode === 410;
        return {
          status: permanent ? "expired" : "failed",
          ...(statusCode !== undefined ? { statusCode } : {}),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}
