import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

/** Generates a zero-padded numeric OTP of the configured length. */
export function generateOtpCode(): string {
  const max = 10 ** env.OTP_LENGTH;
  return randomInt(0, max)
    .toString()
    .padStart(env.OTP_LENGTH, "0");
}

export function hashOtp(code: string): Promise<string> {
  // Cheaper than password hashing — OTPs are short-lived and single-use.
  return bcrypt.hash(code, 8);
}

export function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiry(): Date {
  return new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000);
}
