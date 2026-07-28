import type { EmailSender, CodeMessage } from "../provider.types.js";

/**
 * Console email sender — logs instead of sending. Only used as the fallback
 * when `RESEND_API_KEY` is not configured (e.g. a fresh clone without
 * secrets); with the key set, the registry selects the live Resend sender.
 */
export const consoleEmailSender: EmailSender = {
  async sendCode({ destination, code, purpose, expiresInMinutes }: CodeMessage) {
    // eslint-disable-next-line no-console
    console.info(
      `[EMAIL:dummy] ${purpose} code for ${destination}: ${code} (expires in ${expiresInMinutes}m)`,
    );
  },
};
