import type { FastifyRequest, FastifyReply } from "fastify";
import { ok, list } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import {
  otpRequestSchema,
  otpVerifySchema,
  linkRequestSchema,
  linkVerifySchema,
  customerUpdateSchema,
} from "./auth.schema.js";
import * as service from "./auth.service.js";

// ---- Login (public) ------------------------------------------------------

export async function requestOtp(request: FastifyRequest, reply: FastifyReply) {
  const input = otpRequestSchema.parse(request.body);
  return reply.status(201).send(ok(await service.requestLoginOtp(input)));
}

export async function verifyOtp(request: FastifyRequest) {
  const input = otpVerifySchema.parse(request.body);
  return ok(await service.verifyLoginOtp(input));
}

// ---- Authenticated customer ("me") --------------------------------------

function currentCustomerId(request: FastifyRequest): string {
  if (!request.customer) throw HttpError.unauthorized();
  return request.customer.id;
}

export async function me(request: FastifyRequest) {
  return ok(await service.getProfile(currentCustomerId(request)));
}

export async function updateMe(request: FastifyRequest) {
  const input = customerUpdateSchema.parse(request.body);
  return ok(await service.updateProfile(currentCustomerId(request), input));
}

export async function myOrders(request: FastifyRequest) {
  const orders = await service.listOwnOrders(currentCustomerId(request));
  return list(orders, {
    total: orders.length,
    page: 1,
    pageSize: orders.length,
    totalPages: 1,
  });
}

// ---- Link a second identifier (email <-> phone) -------------------------

export async function requestLink(request: FastifyRequest, reply: FastifyReply) {
  const input = linkRequestSchema.parse(request.body);
  const result = await service.requestLinkOtp(currentCustomerId(request), input);
  return reply.status(201).send(ok(result));
}

export async function verifyLink(request: FastifyRequest) {
  const input = linkVerifySchema.parse(request.body);
  return ok(await service.verifyLinkOtp(currentCustomerId(request), input));
}
