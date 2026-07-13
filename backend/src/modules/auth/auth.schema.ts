import { z } from "zod";
import { phoneSchema } from "../../utils/zodHelpers.js";

const emailSchema = z.string().trim().toLowerCase().email();

// A request carries exactly one identifier: email OR phone.
const identifierShape = {
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
};
const exactlyOneIdentifier = (v: {
  email?: string | undefined;
  phone?: string | undefined;
}) => Boolean(v.email) !== Boolean(v.phone);
const oneIdentifierError = {
  message: "Provide exactly one of email or phone",
  path: ["identifier"],
};

/** Request a login OTP to an email or phone. */
export const otpRequestSchema = z
  .object(identifierShape)
  .refine(exactlyOneIdentifier, oneIdentifierError);

/** Verify a login OTP. */
export const otpVerifySchema = z
  .object({ ...identifierShape, code: z.string().trim().min(4).max(8) })
  .refine(exactlyOneIdentifier, oneIdentifierError);

/** Request an OTP to link a second identifier to the current account. */
export const linkRequestSchema = otpRequestSchema;

/** Verify and complete linking. */
export const linkVerifySchema = otpVerifySchema;

/** Editable profile fields (identifiers are changed only via verified linking). */
export const customerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  altPhone: phoneSchema.nullable().optional(),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
