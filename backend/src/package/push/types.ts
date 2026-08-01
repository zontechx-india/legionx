/**
 * The push package's port. Everything above it (the notifications module)
 * depends on this interface only, so swapping Web Push for FCM/APNs later is
 * one new driver — no caller changes.
 */

/** One device's subscription, exactly as the browser's Push API hands it over. */
export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** What the service worker renders. Kept small — payloads are size-capped. */
export interface PushPayload {
  title: string;
  body: string;
  /** In-app path opened when the notification is clicked. */
  url?: string | null;
  /** Collapse key: a newer message with the same tag replaces the older one. */
  tag?: string | null;
  /** Free-form extras the client may need without a second fetch. */
  data?: Record<string, unknown>;
}

/**
 * `expired` is the one outcome callers must act on: the push service says the
 * endpoint is permanently gone (404/410), so the row should stop being used.
 * `failed` is transient — the caller counts it and retries next time.
 */
export type PushStatus = "sent" | "expired" | "failed";

export interface PushResult {
  status: PushStatus;
  statusCode?: number;
  error?: string;
}

export interface PushSender {
  /** VAPID public key browsers subscribe with; null when unconfigured. */
  readonly publicKey: string | null;
  readonly configured: boolean;
  send(target: PushTarget, payload: PushPayload): Promise<PushResult>;
}
