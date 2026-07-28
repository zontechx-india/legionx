import type { FastifyRequest, FastifyReply } from "fastify";
import { ok } from "../../utils/response.js";
import {
  addressCreateSchema,
  addressParamSchema,
  addressUpdateSchema,
} from "./addresses.schema.js";
import * as service from "./addresses.service.js";

/** All handlers run behind `requireCustomer` (addresses.routes.ts). */

export async function listAddresses(request: FastifyRequest) {
  return ok(await service.listAddresses(request.customer!.id));
}

export async function createAddress(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = addressCreateSchema.parse(request.body);
  const address = await service.createAddress(request.customer!.id, input);
  return reply.status(201).send(ok(address));
}

export async function updateAddress(request: FastifyRequest) {
  const { addressId } = addressParamSchema.parse(request.params);
  const input = addressUpdateSchema.parse(request.body);
  return ok(await service.updateAddress(request.customer!.id, addressId, input));
}

export async function deleteAddress(request: FastifyRequest) {
  const { addressId } = addressParamSchema.parse(request.params);
  return ok(await service.deleteAddress(request.customer!.id, addressId));
}
