import { z } from "zod";
import { paginationQuery } from "../../utils/zodHelpers.js";

/**
 * A browser subscription, exactly as `PushSubscription.toJSON()` produces it.
 * The client sends it verbatim after `pushManager.subscribe()`.
 */
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
});

export const notificationListQuery = paginationQuery.extend({
  /** "true" = unread only — what the bell menu's filter sends. */
  unreadOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

/**
 * Admin broadcast. `audience` picks the principal pool; keeping it an enum
 * (rather than free-form filters) means a mis-typed request can never fan out
 * wider than intended.
 */
export const broadcastSchema = z.object({
  audience: z.enum(["ADMINS", "CUSTOMERS", "SELLERS"]),
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(3).max(300),
  url: z.string().trim().max(500).optional().nullable(),
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuery>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
