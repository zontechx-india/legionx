import { z } from "zod";

/** /public/stores/:slug/orders/:orderId/pay — the retry-payment route. */
export const payParamSchema = z.object({
  slug: z.string().min(1),
  orderId: z.string().min(1),
});
