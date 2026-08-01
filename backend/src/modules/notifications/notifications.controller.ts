import type { FastifyRequest } from "fastify";
import { ok, list } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { idParamSchema } from "../../utils/zodHelpers.js";
import {
  broadcastSchema,
  notificationListQuery,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "./notifications.schema.js";
import * as service from "./notifications.service.js";
import type { PrincipalType } from "./notifications.service.js";

/**
 * One controller serves both surfaces. The routes differ only in which guard
 * ran, so the principal is resolved from whichever the guard attached — there
 * is no way for a customer request to read an admin's feed and vice versa.
 */
function principalOf(request: FastifyRequest): {
  type: PrincipalType;
  id: string;
} {
  if (request.admin) return { type: "ADMIN", id: request.admin.id };
  if (request.customer) return { type: "CUSTOMER", id: request.customer.id };
  throw HttpError.unauthorized();
}

export async function getPushConfig() {
  return ok(service.pushConfig());
}

export async function subscribe(request: FastifyRequest) {
  const input = pushSubscribeSchema.parse(request.body);
  const { type, id } = principalOf(request);
  const userAgent = request.headers["user-agent"]?.slice(0, 255) ?? null;
  return ok(await service.saveSubscription(type, id, input, userAgent));
}

export async function unsubscribe(request: FastifyRequest) {
  const input = pushUnsubscribeSchema.parse(request.body);
  const { type, id } = principalOf(request);
  return ok(await service.removeSubscription(type, id, input.endpoint));
}

export async function listDevices(request: FastifyRequest) {
  const { type, id } = principalOf(request);
  return ok(await service.listSubscriptions(type, id));
}

export async function listFeed(request: FastifyRequest) {
  const query = notificationListQuery.parse(request.query);
  const { type, id } = principalOf(request);
  const { rows, unread, meta } = await service.listNotifications(type, id, query);
  return { ...list(rows, meta), unread };
}

export async function getUnreadCount(request: FastifyRequest) {
  const { type, id } = principalOf(request);
  return ok(await service.unreadCount(type, id));
}

export async function markRead(request: FastifyRequest) {
  const { id: notificationId } = idParamSchema.parse(request.params);
  const { type, id } = principalOf(request);
  return ok(await service.markRead(type, id, notificationId));
}

export async function markAllRead(request: FastifyRequest) {
  const { type, id } = principalOf(request);
  return ok(await service.markAllRead(type, id));
}

/** Admin-only: one message to a whole audience. */
export async function broadcast(request: FastifyRequest) {
  const input = broadcastSchema.parse(request.body);
  return ok(await service.broadcast(input));
}
