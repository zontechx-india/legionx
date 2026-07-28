import { authEnv } from "../../core/config/env.js";
import { HttpError } from "../../../../utils/httpError.js";
import type { PhoneOtpProvider, StartedPhoneVerification } from "../provider.types.js";

/**
 * LIVE phone OTP via Message Central (https://messagecentral.com) — a
 * *managed* verification service: it generates, delivers, and validates the
 * code; we only keep its `verificationId` (stored by the engine in
 * `Otp.providerRef`, so it survives restarts and works multi-instance).
 *
 * Selected by the registry when MESSAGE_CENTRAL_CUSTOMER_ID +
 * MESSAGE_CENTRAL_AUTH_TOKEN are set.
 */

interface McResponse {
  responseCode?: unknown;
  message?: string;
  data?: {
    verificationId?: unknown;
    timeout?: unknown; // seconds, e.g. "600.0"
  };
}

async function mcFetch(url: URL, method: "GET" | "POST"): Promise<McResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        authToken: authEnv.MESSAGE_CENTRAL_AUTH_TOKEN as string,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auth] Message Central unreachable:", err);
    throw HttpError.badGateway("Could not reach the SMS service. Please try again.");
  }
  try {
    return (await response.json()) as McResponse;
  } catch {
    throw HttpError.badGateway(`SMS service returned an invalid response (${response.status}).`);
  }
}

function timeoutToMinutes(timeout: unknown): number {
  const seconds = Number.parseFloat(String(timeout));
  return Number.isFinite(seconds) && seconds > 0
    ? Math.max(1, Math.round(seconds / 60))
    : authEnv.OTP_TTL_MINUTES;
}

export const messageCentralOtpProvider: PhoneOtpProvider = {
  async start(phone): Promise<StartedPhoneVerification> {
    const url = new URL(authEnv.MESSAGE_CENTRAL_SEND_URL);
    url.searchParams.set("countryCode", authEnv.SMS_COUNTRY_CODE);
    url.searchParams.set("customerId", authEnv.MESSAGE_CENTRAL_CUSTOMER_ID as string);
    url.searchParams.set("flowType", "SMS");
    url.searchParams.set("mobileNumber", phone);

    const body = await mcFetch(url, "POST");
    const code = String(body.responseCode);

    if (code === "200") {
      const verificationId = body.data?.verificationId;
      if (verificationId === undefined || verificationId === null) {
        throw HttpError.badGateway("SMS service did not return a verification id.");
      }
      return {
        providerRef: String(verificationId),
        expiresInMinutes: timeoutToMinutes(body.data?.timeout),
      };
    }
    // 506 — a verification for this number is already in flight.
    if (code === "506") {
      throw HttpError.tooManyRequests(
        "An OTP was already sent to this number. Please wait for it or try again shortly.",
      );
    }
    // eslint-disable-next-line no-console
    console.error(`[auth] Message Central send failed (${code}): ${body.message ?? ""}`);
    throw HttpError.badGateway("Could not send the verification code. Please try again.");
  },

  async check({ phone, code, providerRef }): Promise<void> {
    const url = new URL(authEnv.MESSAGE_CENTRAL_VERIFY_URL);
    url.searchParams.set("countryCode", authEnv.SMS_COUNTRY_CODE);
    url.searchParams.set("customerId", authEnv.MESSAGE_CENTRAL_CUSTOMER_ID as string);
    url.searchParams.set("mobileNumber", phone);
    url.searchParams.set("verificationId", providerRef);
    url.searchParams.set("code", code);

    const body = await mcFetch(url, "GET");
    const responseCode = String(body.responseCode);

    switch (responseCode) {
      case "200":
        return;
      case "702": // wrong OTP
        throw HttpError.unauthorized("Incorrect code.");
      case "705": // OTP expired
      case "505": // verification expired / invalid
        throw HttpError.unauthorized("Code expired. Please request a new one.");
      default:
        // eslint-disable-next-line no-console
        console.error(
          `[auth] Message Central verify failed (${responseCode}): ${body.message ?? ""}`,
        );
        throw HttpError.badGateway("Could not verify the code. Please try again.");
    }
  },
};
