import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import { authEnv } from "../../core/config/env.js";
import { HttpError } from "../../../../utils/httpError.js";
import type { PhoneOtpProvider, StartedPhoneVerification } from "../provider.types.js";

/**
 * Console phone-OTP fallback — used only when Message Central credentials are
 * not configured (e.g. a fresh clone without secrets). Generates a local code,
 * logs it, and hands its bcrypt hash to the engine as the `providerRef`;
 * `check` compares against that hash. Outside production the code is also
 * echoed as `devCode` so the flow is testable without reading server logs.
 */
export const consoleOtpProvider: PhoneOtpProvider = {
  async start(phone): Promise<StartedPhoneVerification> {
    const max = 10 ** authEnv.OTP_LENGTH;
    const code = randomInt(0, max).toString().padStart(authEnv.OTP_LENGTH, "0");
    // eslint-disable-next-line no-console
    console.info(`[SMS:console] OTP for ${phone}: ${code} (expires in ${authEnv.OTP_TTL_MINUTES}m)`);
    return {
      providerRef: await bcrypt.hash(code, 8),
      expiresInMinutes: authEnv.OTP_TTL_MINUTES,
      devCode: code,
    };
  },

  async check({ code, providerRef }): Promise<void> {
    const matches = await bcrypt.compare(code, providerRef);
    if (!matches) throw HttpError.unauthorized("Incorrect code.");
  },
};
