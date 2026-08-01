import webpush from "web-push";

/**
 * Generates a VAPID key pair for Web Push (`npm run push-keys`).
 *
 * Run once per environment and paste the output into `.env`. The pair is the
 * server's identity to every push service, so rotating it invalidates every
 * existing subscription — generate once, then keep it.
 */
const { publicKey, privateKey } = webpush.generateVAPIDKeys();

// eslint-disable-next-line no-console
console.log(
  [
    "",
    "VAPID key pair generated — add these to backend/.env:",
    "",
    `VAPID_PUBLIC_KEY="${publicKey}"`,
    `VAPID_PRIVATE_KEY="${privateKey}"`,
    'VAPID_SUBJECT="mailto:you@example.com"',
    "",
    "Keep VAPID_PRIVATE_KEY secret. Rotating the pair invalidates every",
    "existing browser subscription, so generate it once per environment.",
    "",
  ].join("\n"),
);
