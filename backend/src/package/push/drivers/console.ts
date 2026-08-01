import type { PushSender, PushPayload, PushResult, PushTarget } from "../types.js";

/**
 * Fallback driver used when no VAPID keys are configured — logs instead of
 * sending, exactly like `package/mail`'s console fallback. Development keeps
 * working end-to-end (notification rows are still written and the feed still
 * fills) and nothing is silently dropped.
 */
export function createConsolePushDriver(): PushSender {
  return {
    publicKey: null,
    configured: false,

    async send(target: PushTarget, payload: PushPayload): Promise<PushResult> {
      const device = target.endpoint.slice(-12);
      // eslint-disable-next-line no-console
      console.log(
        `🔔 [push:console] …${device} "${payload.title}" — ${payload.body}`,
      );
      return { status: "sent" };
    },
  };
}
