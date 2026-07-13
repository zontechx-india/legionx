import { z } from "zod";

/**
 * Safe boolean coercion for query strings. `z.coerce.boolean()` uses JS
 * `Boolean()`, so the string "false" becomes `true`. This treats the usual
 * truthy/falsy string tokens correctly.
 */
export const boolQuery = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((v) => v === true || v === "true" || v === "1");

/** Shared pagination query params. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** Common route params. */
export const idParamSchema = z.object({ id: z.string().min(1) });
export const slugParamSchema = z.object({ slug: z.string().min(1) });

/** Phone number — digits, optional leading +, 7–15 chars (loose E.164). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number");
