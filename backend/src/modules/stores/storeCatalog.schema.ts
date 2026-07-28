import { z } from "zod";

/**
 * Catalog inside a customer-owned store, following the hierarchy
 * Store → Category → Subcategory (optional) → Product → Variants.
 * Products require a category (root or subcategory), so the create schemas
 * encode the setup sequence: category first, then products.
 */

export const storeCategoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(60),
  /** Parent category id → creates a subcategory (one level only). */
  parentId: z.string().min(1).optional(),
});

/**
 * Partial update of a category. Covers both renaming and the
 * enable/disable toggle, so one PATCH serves the whole row.
 * Re-parenting is deliberately not supported yet (it would have to revalidate
 * the one-level nesting rule for every descendant).
 */
export const storeCategoryUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Category name is required")
      .max(60)
      .optional(),
    isActive: z.boolean().optional(),
    /** Surfaces the category in the storefront homepage's Featured row. */
    isFeatured: z.boolean().optional(),
  })
  .refine(
    (patch) =>
      patch.name !== undefined ||
      patch.isActive !== undefined ||
      patch.isFeatured !== undefined,
    { message: "Provide a name, isActive or isFeatured to update" },
  );

/** One variant of a product — a single label covers whatever axes apply
 *  ("Red", "XL", "128 GB", "Red / 128 GB"). The variant is the unit of sale,
 *  so it always carries its own price. */
const variantInputSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required").max(60),
  price: z.number().min(0).max(99_999_999.99),
  stockQuantity: z.number().int().min(0),
});

/**
 * Creating a product. `hasVariants` is the explicit discriminator between the
 * two product shapes, so a payload is never ambiguous:
 *
 *   false → `price` + `stockQuantity` required; `variants` must be empty.
 *           The product gets one implicit `Default` variant carrying them.
 *   true  → at least one entry in `variants`, each with its own name, price
 *           and stock; `price`/`stockQuantity` are not accepted.
 *
 * Either way exactly one price source exists — never two competing fields.
 */
export const storeProductCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required").max(120),
    categoryId: z.string().min(1, "Category is required"),
    description: z.string().trim().max(2000).optional(),
    hasVariants: z.boolean().default(false),
    /** Simple products only. */
    price: z.number().min(0).max(99_999_999.99).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    /** Variant products only. */
    variants: z
      .array(variantInputSchema)
      .max(50)
      .optional()
      .refine(
        (variants) =>
          !variants ||
          new Set(variants.map((v) => v.name.toLowerCase())).size ===
            variants.length,
        { message: "Variant names must be unique" },
      ),
  })
  .superRefine((input, ctx) => {
    if (input.hasVariants) {
      if (!input.variants || input.variants.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["variants"],
          message: "Add at least one variant",
        });
      }
      return;
    }

    if (input.price === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Price is required",
      });
    }
    if (input.stockQuantity === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["stockQuantity"],
        message: "Stock quantity is required",
      });
    }
    if (input.variants && input.variants.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Enable hasVariants to submit variants",
      });
    }
  });

export const storeVariantCreateSchema = variantInputSchema;

export const storeVariantUpdateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  /** A variant always has a price — it can be changed but never cleared. */
  price: z.number().min(0).max(99_999_999.99).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Partial update of a product. Covers the editable details (name,
 * description, category), the storefront visibility switch, and the
 * merchandising flags. Each flag maps to exactly one homepage section, so
 * merchants curate the shop without code changes and without one flag ever
 * affecting another section. The slug is deliberately NOT editable — it is
 * the product's public URL identity and stays stable across renames.
 */
export const storeProductUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required")
      .max(120)
      .optional(),
    /** `null` clears the description. */
    description: z.string().trim().max(2000).nullable().optional(),
    /** Move the product to another category (root or sub) of the same store. */
    categoryId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    hideFromSearch: z.boolean().optional(),
  })
  .refine((patch) => Object.values(patch).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

/**
 * Media metadata update — alt text only (the binary is replaced via the
 * dedicated /file endpoint; order via /order). `null` clears the alt text.
 */
export const storeMediaUpdateSchema = z.object({
  altText: z.string().trim().max(200).nullable(),
});

/**
 * Full ordered list of the product's IMAGE media ids. The first id becomes
 * the cover image. The video (if any) is not part of the ordering.
 */
export const storeMediaOrderSchema = z.object({
  mediaIds: z.array(z.string().min(1)).min(1).max(8),
});

/** Nested route params: /stores/:id/... (`:id` = store id or slug). */
export const storeCategoryParamSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
});

export const storeProductParamSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
});

export const storeVariantParamSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().min(1),
});

export const storeMediaParamSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  mediaId: z.string().min(1),
});

export type StoreMediaUpdateInput = z.infer<typeof storeMediaUpdateSchema>;
export type StoreMediaOrderInput = z.infer<typeof storeMediaOrderSchema>;
export type StoreCategoryCreateInput = z.infer<typeof storeCategoryCreateSchema>;
export type StoreCategoryUpdateInput = z.infer<typeof storeCategoryUpdateSchema>;
export type StoreProductCreateInput = z.infer<typeof storeProductCreateSchema>;
export type StoreProductUpdateInput = z.infer<typeof storeProductUpdateSchema>;
export type StoreVariantCreateInput = z.infer<typeof storeVariantCreateSchema>;
export type StoreVariantUpdateInput = z.infer<typeof storeVariantUpdateSchema>;
