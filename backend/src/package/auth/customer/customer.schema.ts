import { z } from "zod";
import { phoneSchema } from "../../../utils/zodHelpers.js";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);
const codeSchema = z.string().trim().min(4).max(8);

// ---- Email + password (primary) ------------------------------------------

/**
 * Registration is verify-first: `register/request` validates the whole form
 * (so password errors surface before the code is sent) and emails a code;
 * `register/verify` re-sends the same fields plus the code — the account is
 * only created (already verified) at that point.
 */
export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120).optional(),
});

export const registerVerifySchema = registerRequestSchema.extend({
  code: codeSchema,
});

export const passwordLoginSchema = z.object({
  email: emailSchema,
  // No min-length here — never hint at password rules on login.
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  newPassword: passwordSchema,
});

/** Set (social/OTP-only account) or change (password account) the password. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: passwordSchema,
});

// ---- Google sign-in --------------------------------------------------------

export const googleSignInSchema = z.object({
  idToken: z.string().min(1),
});

// ---- Phone OTP login -------------------------------------------------------

export const otpRequestSchema = z.object({ phone: phoneSchema });

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: codeSchema,
});

// ---- Identifier linking (add a phone to the account, or a second email path) --

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

export const linkRequestSchema = z
  .object(identifierShape)
  .refine(exactlyOneIdentifier, oneIdentifierError);

export const linkVerifySchema = z
  .object({ ...identifierShape, code: codeSchema })
  .refine(exactlyOneIdentifier, oneIdentifierError);

// ---- Profile ---------------------------------------------------------------

/** Editable profile fields (identifiers are changed only via verified linking). */
export const customerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  altPhone: phoneSchema.nullable().optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
});

export type RegisterRequestInput = z.infer<typeof registerRequestSchema>
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type LinkRequestInput = z.infer<typeof linkRequestSchema>;
export type LinkVerifyInput = z.infer<typeof linkVerifySchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
