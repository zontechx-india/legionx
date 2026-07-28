import type { FastifyRequest, FastifyReply } from "fastify";
import { ok } from "../../../utils/response.js";
import { HttpError } from "../../../utils/httpError.js";
import { issueSession } from "../core/session.service.js";
import { sessionMeta } from "../core/cookies.js";
import { deliverWeb, deliverMobile } from "../core/delivery.js";
import { adminLoginSchema } from "./admin.schema.js";
import * as service from "./admin.service.js";

/** Web login → sets httpOnly cookies, returns the admin. */
export async function webLogin(request: FastifyRequest, reply: FastifyReply) {
  const input = adminLoginSchema.parse(request.body);
  const { principal, admin } = await service.authenticate(input);
  const tokens = await issueSession(principal, sessionMeta(request));
  return deliverWeb(reply, tokens, { admin });
}

/** Mobile login → returns access + refresh tokens in the body. */
export async function mobileLogin(request: FastifyRequest) {
  const input = adminLoginSchema.parse(request.body);
  const { principal, admin } = await service.authenticate(input);
  const tokens = await issueSession(principal, sessionMeta(request));
  return deliverMobile(tokens, { admin });
}

export async function me(request: FastifyRequest) {
  // requireAdmin guard guarantees request.admin is set.
  const admin = request.admin;
  if (!admin) throw HttpError.unauthorized();
  return ok(await service.getProfile(admin.id));
}
