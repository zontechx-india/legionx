import { z } from "zod";

/**
 * Marketplace discovery surface (`/api/v1/public/search`, `/public/stats`) —
 * platform-wide, anonymous, read-only.
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
