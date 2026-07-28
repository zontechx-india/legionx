import { HttpError } from "../../../utils/httpError.js";
import { authEnv } from "../core/config/env.js";
import { consoleEmailSender } from "./email/console.email.provider.js";
import { resendEmailSender } from "./email/resend.email.provider.js";
import { consoleOtpProvider } from "./sms/console.otp.provider.js";
import { messageCentralOtpProvider } from "./sms/messageCentral.otp.provider.js";
import { mockGoogleVerifier } from "./oauth/google.mock.verifier.js";
import { bcryptPasswordHasher } from "./password/bcrypt.hasher.js";
import type {
  EmailSender,
  PhoneOtpProvider,
  OAuthVerifier,
  OAuthProviderName,
  PasswordHasher,
} from "./provider.types.js";

/**
 * Provider registry — the **single place** where implementations are chosen.
 *
 * Live today: email (Resend), phone OTP (Message Central), password hashing
 * (bcrypt) — each with a console fallback when its credentials are absent.
 * Still mock: Google token verification (awaiting GOOGLE_CLIENT_ID). Swapping
 * or adding a provider = one adapter file + one line here. No strategy,
 * controller, or route changes.
 */

const messageCentralConfigured = Boolean(
  authEnv.MESSAGE_CENTRAL_CUSTOMER_ID && authEnv.MESSAGE_CENTRAL_AUTH_TOKEN,
);

export const authProviders: {
  email: EmailSender;
  phoneOtp: PhoneOtpProvider;
  passwordHasher: PasswordHasher;
  oauth: Partial<Record<OAuthProviderName, OAuthVerifier>>;
} = {
  // Resend when the API key is configured; console dummy otherwise.
  email: authEnv.RESEND_API_KEY ? resendEmailSender : consoleEmailSender,
  // Message Central when credentials are configured; console fallback otherwise.
  phoneOtp: messageCentralConfigured ? messageCentralOtpProvider : consoleOtpProvider,
  passwordHasher: bcryptPasswordHasher,
  oauth: {
    // Google postponed — endpoints answer 400 "not enabled" until it's planned.
    // To re-enable for dev: uncomment the mock; for launch: use the real
    // google-auth-library verifier (see PACKAGE_AUTH.md §6).
    // GOOGLE: mockGoogleVerifier,
    // APPLE: appleVerifier — planned; add the adapter + this line to enable.
  },
};

/** Resolves the verifier for a social provider, or 400 if it isn't enabled. */
export function oauthVerifier(provider: OAuthProviderName): OAuthVerifier {
  const verifier = authProviders.oauth[provider];
  if (!verifier) {
    throw HttpError.badRequest(`${provider} sign-in is not enabled`);
  }
  return verifier;
}
