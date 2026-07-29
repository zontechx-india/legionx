import type { FastifyRequest, FastifyReply } from "fastify";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { payParamSchema } from "./payments.schema.js";
import * as service from "./payments.service.js";

/**
 * Cashfree webhook receiver. The route's scope parses application/json to a
 * raw Buffer so the HMAC is computed over the exact bytes Cashfree signed.
 * Bad signature → 401 (and Cashfree stops retrying); verified events answer
 * 200 even when they are business no-ops, so retries drain instead of
 * looping. A thrown DB error still bubbles to a 5xx — that IS a retry-worthy
 * failure.
 */
export async function handleCashfreeWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const rawBody = request.body as Buffer;
  const signature = request.headers["x-webhook-signature"];
  const timestamp = request.headers["x-webhook-timestamp"];
  if (
    !Buffer.isBuffer(rawBody) ||
    typeof signature !== "string" ||
    typeof timestamp !== "string" ||
    !service.verifyWebhookSignature(rawBody, signature, timestamp)
  ) {
    throw HttpError.unauthorized("Invalid webhook signature");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw HttpError.badRequest("Invalid webhook payload");
  }

  await service.processWebhook(payload as Parameters<typeof service.processWebhook>[0]);
  return reply.status(200).send({ received: true });
}

/** Runs behind `requireCustomer` — "Pay now / Retry payment" on an order. */
export async function createPaySession(request: FastifyRequest) {
  const { slug, orderId } = payParamSchema.parse(request.params);
  return ok(
    await service.getOrCreatePaySession(slug, orderId, request.customer!.id),
  );
}
