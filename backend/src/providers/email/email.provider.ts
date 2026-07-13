/**
 * Email provider abstraction.
 *
 * No real email service is wired yet. This stub logs messages so the email-OTP
 * flow is testable in development. Swap for SES / Resend / SMTP later without
 * touching callers.
 */
export interface EmailProvider {
  sendOtp(email: string, code: string): Promise<void>;
  sendMessage(email: string, subject: string, body: string): Promise<void>;
}

const consoleEmailProvider: EmailProvider = {
  async sendOtp(email, code) {
    // eslint-disable-next-line no-console
    console.info(`[EMAIL] OTP for ${email}: ${code}`);
  },
  async sendMessage(email, subject, body) {
    // eslint-disable-next-line no-console
    console.info(`[EMAIL] to ${email} — ${subject}: ${body}`);
  },
};

export const emailProvider: EmailProvider = consoleEmailProvider;
