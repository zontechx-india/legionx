import "dotenv/config";

/**
 * Push package configuration — parsed here, not in the app's `config/env.ts`,
 * so the package stays self-contained (same convention as `package/storage`
 * and `package/mail`).
 *
 * Web Push identifies the SENDER with a VAPID key pair: the public key is
 * handed to browsers when they subscribe, the private key signs every send.
 * Generate a pair once with `npm run push-keys` and keep the private key
 * secret — rotating it invalidates every existing subscription.
 */

const blank = (value: string | undefined) =>
  value && value.trim() ? value.trim() : undefined;

const publicKey = blank(process.env["VAPID_PUBLIC_KEY"]);
const privateKey = blank(process.env["VAPID_PRIVATE_KEY"]);

export const pushConfig = {
  publicKey: publicKey ?? null,
  privateKey: privateKey ?? null,
  /** Contact URL/mailto the push service can reach us on (VAPID requirement). */
  subject: blank(process.env["VAPID_SUBJECT"]) ?? "mailto:connect@zontechx.com",
  /** How long a push service should hold an undelivered message (seconds). */
  ttlSeconds: Number(process.env["PUSH_TTL_SECONDS"] ?? 86_400),
  /** Both keys present = real delivery; otherwise the console fallback. */
  configured: Boolean(publicKey && privateKey),
} as const;
