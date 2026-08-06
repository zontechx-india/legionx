import { z } from "zod";

/**
 * Seller payout bank accounts. A store can save several (capped), exactly
 * one may be **primary** — the only account that receives payouts from
 * UnieMax when customers pay through the platform.
 *
 * Verification is provisioned but not wired yet: accounts start PENDING and
 * will be verified by a third-party account-validation provider or manually
 * by a UnieMax admin (future admin panel). Editing any bank detail of a
 * verified account resets it to PENDING for re-verification.
 */

/** Indian bank account number — digits only, 9–18 characters. */
const accountNumber = z
  .string()
  .trim()
  .regex(/^\d{9,18}$/, "Account number must be 9–18 digits");

/** IFSC: 4 letters + 0 + 6 alphanumerics (e.g. HDFC0001234). */
const ifsc = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Must be a valid IFSC code like HDFC0001234");

/** UPI VPA, e.g. name@okhdfcbank. */
const upiId = z
  .string()
  .trim()
  .max(256)
  .regex(/^[\w.-]{2,}@[a-zA-Z]{2,64}$/, "Must be a UPI ID like name@bank")
  .nullish()
  .transform((v) => (v ? v : null));

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max);

export const bankAccountCreateSchema = z.object({
  accountHolderName: requiredText("Account holder name", 100),
  accountNumber,
  ifsc,
  bankName: requiredText("Bank name", 100),
  branch: requiredText("Branch", 100),
  upiId,
  /** Make this the payout account immediately (the first saved account
   *  becomes primary automatically regardless). */
  isPrimary: z.boolean().optional(),
});

/**
 * Partial update. `isPrimary` accepts only `true` — the way to demote a
 * primary account is to promote another one, so the payout target can never
 * be silently unset by an edit.
 */
export const bankAccountUpdateSchema = z
  .object({
    accountHolderName: requiredText("Account holder name", 100).optional(),
    accountNumber: accountNumber.optional(),
    ifsc: ifsc.optional(),
    bankName: requiredText("Bank name", 100).optional(),
    branch: requiredText("Branch", 100).optional(),
    upiId: upiId.optional(),
    isPrimary: z.literal(true).optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: "Provide at least one field to update",
  });

export const bankAccountParamSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
});

/** The bank-detail fields whose change invalidates a verification. */
export const BANK_DETAIL_FIELDS = [
  "accountHolderName",
  "accountNumber",
  "ifsc",
  "bankName",
  "branch",
  "upiId",
] as const;

export type BankAccountCreateInput = z.infer<typeof bankAccountCreateSchema>;
export type BankAccountUpdateInput = z.infer<typeof bankAccountUpdateSchema>;
