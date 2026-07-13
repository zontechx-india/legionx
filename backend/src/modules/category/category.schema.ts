import { z } from "zod";
import { boolQuery, paginationQuery } from "../../utils/zodHelpers.js";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const categoryListQuerySchema = paginationQuery.extend({
  q: z.string().trim().optional(),
  // "root" restricts to top-level categories; otherwise filter by parent id.
  parentId: z.string().min(1).optional(),
  rootOnly: boolQuery.optional(),
  isActive: boolQuery.optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
