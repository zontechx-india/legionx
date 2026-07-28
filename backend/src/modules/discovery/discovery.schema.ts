import { z } from "zod";
import { paginationQuery } from "../../utils/zodHelpers.js";

/**
 * Marketplace discovery surface (`/api/v1/public/search`, `/public/products`,
 * `/public/stats`) — platform-wide, anonymous, read-only.
 */

/**
 * Global search. `q` needs 2+ characters (the UI starts searching there too),
 * `limit` caps EACH result group, not the union — results are always grouped
 * (stores / categories / products), never interleaved.
 */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Platform-wide product rail (`GET /public/products`) — newest visible
 * products across all published stores (the homepage "Fresh Finds" row).
 * Recency-only by design: no popularity/analytics sort exists yet, so the
 * only order is newest-first and the schema stays pagination-only.
 */
export const newProductsQuerySchema = paginationQuery;

export type NewProductsQuery = z.infer<typeof newProductsQuerySchema>;
