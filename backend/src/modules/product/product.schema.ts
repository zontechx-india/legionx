import { z } from "zod";
import { boolQuery, paginationQuery } from "../../utils/zodHelpers.js";

const productImageSchema = z.object({
  url: z.string().url(),
  isCover: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const priceSchema = z.number().nonnegative().max(9_999_999);

export const productCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    sku: z.string().trim().min(1).max(64),
    categoryId: z.string().min(1),
    brand: z.string().trim().max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    price: priceSchema,
    discountPrice: priceSchema.optional(),
    stockQuantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).nullable().optional(),
    // Flexible key/value spec map — any product type, no schema change.
    specifications: z.record(z.string(), z.string()).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    isFeatured: z.boolean().optional(),
    images: z.array(productImageSchema).max(20).optional(),
  })
  .refine(
    (v) => v.discountPrice === undefined || v.discountPrice <= v.price,
    { path: ["discountPrice"], message: "Discount price cannot exceed price." },
  );

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    sku: z.string().trim().min(1).max(64).optional(),
    categoryId: z.string().min(1).optional(),
    brand: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    price: priceSchema.optional(),
    discountPrice: priceSchema.nullable().optional(),
    stockQuantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).nullable().optional(),
    specifications: z.record(z.string(), z.string()).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    isFeatured: z.boolean().optional(),
    // When provided, replaces the full image set for the product.
    images: z.array(productImageSchema).max(20).optional(),
  })
  .refine(
    (v) =>
      v.discountPrice === undefined ||
      v.discountPrice === null ||
      v.price === undefined ||
      v.discountPrice <= v.price,
    { path: ["discountPrice"], message: "Discount price cannot exceed price." },
  );

export const productListQuerySchema = paginationQuery.extend({
  q: z.string().trim().optional(),
  categoryId: z.string().min(1).optional(),
  categorySlug: z.string().min(1).optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  isFeatured: boolQuery.optional(),
  inStock: boolQuery.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"])
    .default("newest"),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
