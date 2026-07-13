/**
 * SMS provider abstraction.
 *
 * No real gateway is wired yet (Phase 2). This stub logs messages so the OTP
 * flow is fully testable in development. Swap the implementation for Twilio /
 * MSG91 / etc. later without touching callers.
 */
export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
  sendMessage(phone: string, message: string): Promise<void>;
}

const consoleSmsProvider: SmsProvider = {
  async sendOtp(phone, code) {
    // eslint-disable-next-line no-console
    console.info(`[SMS] OTP for ${phone}: ${code}`);
  },
  async sendMessage(phone, message) {
    // eslint-disable-next-line no-console
    console.info(`[SMS] to ${phone}: ${message}`);
  },
};

export const smsProvider: SmsProvider = consoleSmsProvider;
