import { prisma } from "../../core/config/prisma.js";
import { HttpError } from "../../../../utils/httpError.js";
import {
  issueCode,
  consumeCode,
  codeIssueResponse,
} from "../../verification/verification.service.js";
import {
  customerAuthSelect,
  authResult,
} from "../customer.shared.js";
import type { CustomerAuthResult } from "../customer.shared.js";
import type { OtpRequestInput, OtpVerifyInput } from "../customer.schema.js";

/**
 * Mobile number + OTP strategy — **login only, never registration**.
 *
 * Accounts are created with email (register or Google); a phone becomes a
 * sign-in method only after the customer links it from their profile
 * (`/me/link`). An OTP is therefore only ever sent to a phone that already
 * belongs to an account. Delivery goes through the pluggable SMS provider
 * (dummy for now; dev bypass accepts `123456`).
 */

const NO_ACCOUNT_MESSAGE =
  "No account is linked to this mobile number. Sign in with your email, then add your number from your profile.";

export async function requestLoginCode(input: OtpRequestInput) {
  const existing = await prisma.customer.findUnique({
    where: { phone: input.phone },
    select: { id: true },
  });
  if (!existing) throw HttpError.notFound(NO_ACCOUNT_MESSAGE);

  const target = {
    channel: "SMS",
    destination: input.phone,
    purpose: "LOGIN",
    customerId: existing.id,
  } as const;
  const issued = await issueCode(target);
  return codeIssueResponse(target, issued);
}

export async function verifyLoginCode(
  input: OtpVerifyInput,
): Promise<CustomerAuthResult> {
  const existing = await prisma.customer.findUnique({
    where: { phone: input.phone },
    select: { id: true },
  });
  if (!existing) throw HttpError.notFound(NO_ACCOUNT_MESSAGE);

  await consumeCode({
    channel: "SMS",
    destination: input.phone,
    purpose: "LOGIN",
    code: input.code,
    customerId: existing.id,
  });

  // Signing in via OTP re-confirms possession of the number.
  const customer = await prisma.customer.update({
    where: { id: existing.id },
    data: { phoneVerifiedAt: new Date() },
    select: customerAuthSelect,
  });

  return authResult(customer);
}
