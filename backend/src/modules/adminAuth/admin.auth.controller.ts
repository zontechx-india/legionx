import type { FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { adminLoginSchema } from "./admin.auth.schema.js";
import * as service from "./admin.auth.service.js";

export async function login(request: FastifyRequest) {
  const input = adminLoginSchema.parse(request.body);
  return ok(await service.login(input));
}

export async function me(request: FastifyRequest) {
  // requireAdmin guard guarantees request.admin is set.
  const admin = request.admin;
  if (!admin) throw HttpError.unauthorized();
  return ok(await service.getProfile(admin.id));
}
