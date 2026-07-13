import type { FastifyRequest, FastifyReply } from "fastify";
import { ok, list } from "../../utils/response.js";
import { idParamSchema, slugParamSchema } from "../../utils/zodHelpers.js";
import {
  productCreateSchema,
  productUpdateSchema,
  productListQuerySchema,
} from "./product.schema.js";
import * as service from "./product.service.js";

// ---- Public --------------------------------------------------------------

export async function publicListProducts(request: FastifyRequest) {
  const query = productListQuerySchema.parse(request.query);
  const { items, meta } = await service.listProducts(query, {
    forcePublic: true,
  });
  return list(items, meta);
}

export async function publicGetProduct(request: FastifyRequest) {
  const { slug } = slugParamSchema.parse(request.params);
  return ok(await service.getProductBySlug(slug, { forcePublic: true }));
}

// ---- Admin ---------------------------------------------------------------

export async function adminListProducts(request: FastifyRequest) {
  const query = productListQuerySchema.parse(request.query);
  const { items, meta } = await service.listProducts(query, {
    forcePublic: false,
  });
  return list(items, meta);
}

export async function adminGetProduct(request: FastifyRequest) {
  const { id } = idParamSchema.parse(request.params);
  return ok(await service.getProductById(id));
}

export async function adminCreateProduct(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = productCreateSchema.parse(request.body);
  const product = await service.createProduct(input);
  return reply.status(201).send(ok(product));
}

export async function adminUpdateProduct(request: FastifyRequest) {
  const { id } = idParamSchema.parse(request.params);
  const input = productUpdateSchema.parse(request.body);
  return ok(await service.updateProduct(id, input));
}

export async function adminDeleteProduct(request: FastifyRequest) {
  const { id } = idParamSchema.parse(request.params);
  return ok(await service.deleteProduct(id));
}
