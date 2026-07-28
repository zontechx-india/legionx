import { HttpError } from "../../../../utils/httpError.js";
import type { OAuthVerifier, OAuthProfile } from "../provider.types.js";

/**
 * MOCK Google verifier — accepts an **unverified** token so the whole
 * Google-sign-in flow (find-or-create, linking, sessions) can be exercised
 * without Google credentials. It accepts either:
 *
 *   1. a JWT — the payload is base64-decoded **without signature verification**
 *      (so a real Google ID token also works for shape-testing), or
 *   2. a raw JSON string, e.g. `{"sub":"g-123","email":"ravi@example.com","name":"Ravi"}`
 *
 * ⚠️ NEVER ship this to production. The real implementation swaps this file's
 * body for `google-auth-library`'s `OAuth2Client.verifyIdToken({ idToken,
 * audience: authEnv.GOOGLE_CLIENT_ID })` and keeps the same return shape —
 * registered in `providers/index.ts`, nothing else changes.
 */

function decodeClaims(idToken: string): Record<string, unknown> | null {
  const parts = idToken.split(".");
  if (parts.length === 3) {
    try {
      return JSON.parse(Buffer.from(parts[1] as string, "base64url").toString("utf8"));
    } catch {
      return null;
    }
  }
  try {
    const parsed: unknown = JSON.parse(idToken);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const mockGoogleVerifier: OAuthVerifier = {
  provider: "GOOGLE",

  async verifyIdToken(idToken: string): Promise<OAuthProfile> {
    const claims = decodeClaims(idToken);
    const sub = claims?.sub;
    const email = claims?.email;

    if (!claims || typeof sub !== "string" || sub.length === 0) {
      throw HttpError.unauthorized("Invalid Google token");
    }
    if (typeof email !== "string" || email.length === 0) {
      throw HttpError.unauthorized("Google token has no email");
    }

    return {
      providerAccountId: sub,
      email: email.trim().toLowerCase(),
      // Google sets `email_verified`; the mock defaults to true when absent.
      emailVerified: claims.email_verified !== false && claims.email_verified !== "false",
      ...(typeof claims.name === "string" ? { name: claims.name } : {}),
      ...(typeof claims.picture === "string" ? { avatarUrl: claims.picture } : {}),
    };
  },
};
