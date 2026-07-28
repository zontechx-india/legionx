import { z } from "zod";

/**
 * Customer address book. An address carries everything a store's checkout
 * can ask for (see `Store.checkout` field toggles); `email` is optional at
 * the book level because not every store collects it — a store that does
 * asks for it at checkout when the chosen address has none.
 */

const phone = z
  .string()
  .trim()
  .min(5)
  .max(20)
  .regex(/^\+?[\d\s\-()]+$/, "Must be a phone number");

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max);

export const addressCreateSchema = z.object({
  /** Optional list label — "Home", "Work"… */
  label: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .transform((v) => (v ? v : null)),
  name: requiredText("Name", 100),
  phone,
  email: z
    .string()
    .trim()
    .email("Must be a valid email")
    .max(160)
    .nullish()
    .transform((v) => (v ? v : null)),
  addressLine: requiredText("Address", 300),
  pincode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{3,10}$/, "Must be a valid pincode"),
  state: requiredText("State", 100),
  country: requiredText("Country", 100).default("India"),
  /** Make this the default checkout suggestion (first address is primary
   *  automatically regardless). */
  isPrimary: z.boolean().optional(),
});

/**
 * Partial update. `isPrimary` accepts only `true` — the way to demote the
 * primary address is to promote another one.
 */
export const addressUpdateSchema = z
  .object({
    label: addressCreateSchema.shape.label.optional(),
    name: requiredText("Name", 100).optional(),
    phone: phone.optional(),
    email: addressCreateSchema.shape.email.optional(),
    addressLine: requiredText("Address", 300).optional(),
    pincode: addressCreateSchema.shape.pincode.optional(),
    state: requiredText("State", 100).optional(),
    country: requiredText("Country", 100).optional(),
    isPrimary: z.literal(true).optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: "Provide at least one field to update",
  });

export const addressParamSchema = z.object({
  addressId: z.string().min(1),
});

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
