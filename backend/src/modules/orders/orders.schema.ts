import { z } from "zod";
import { paginationQuery } from "../../utils/zodHelpers.js";

/**
 * Storefront order placement (per store, guests welcome). The payload
 * carries item REFERENCES and quantities only — prices always come from the
 * live catalog server-side, never from the client. Which contact/delivery
 * fields are required is decided by the STORE's checkout configuration +
 * the chosen fulfilment, so `customer` is loosely typed here and validated
 * against the store config in the service.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const orderCreateSchema = z.object({
  fulfilment: z.enum(["DELIVERY", "PICKUP"]),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  customer: z
    .object({
      name: optionalText(100),
      phone: optionalText(20),
      email: optionalText(160),
      address: optionalText(300),
      pincode: optionalText(10),
      state: optionalText(100),
      country: optionalText(100),
    })
    .default(() => ({
      name: null,
      phone: null,
      email: null,
      address: null,
      pincode: null,
      state: null,
      country: null,
    })),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        /** Chosen option id — null for simple products. */
        variantId: z
          .string()
          .min(1)
          .nullish()
          .transform((v) => v ?? null),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1, "The order has no items")
    .max(100),
});

export const orderParamSchema = z.object({
  slug: z.string().min(1),
  orderId: z.string().min(1),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderCustomerInput = OrderCreateInput["customer"];

// ---------------------------------------------------------------------------
// Seller order management (/stores/:id/orders — owner-scoped)
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const sellerOrderListQuerySchema = paginationQuery.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  /** Matches order number or customer name/phone. */
  q: z.string().trim().min(1).max(120).optional(),
});

/**
 * Statuses a seller can move an order TO. Cancelling is a separate endpoint
 * (it restores stock and takes a reason), and PENDING is only ever the
 * starting point — an order can't be moved back to it.
 */
export const orderStatusUpdateSchema = z.object({
  status: z.enum(["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"]),
});

export const orderCancelSchema = z.object({
  reason: optionalText(300),
});

export const sellerOrderParamSchema = z.object({
  id: z.string().min(1), // store id or slug
  orderId: z.string().min(1),
});

export type SellerOrderListQuery = z.infer<typeof sellerOrderListQuerySchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type OrderCancelInput = z.infer<typeof orderCancelSchema>;
