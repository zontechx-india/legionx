import type { FastifyRequest, FastifyReply } from "fastify";
import { ok, list } from "../../utils/response.js";
import { idParamSchema, slugParamSchema } from "../../utils/zodHelpers.js";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  categoryListQuerySchema,
} from "./category.schema.js";
import * as service from "./category.service.js";

// ---- Public --------------------------------------------------------------

export async function publicListCategories(request: FastifyRequest) {
  const query = categoryListQuerySchema.parse(request.query);
  // Customers only ever see active categories.
  const { items, meta } = await service.listCategories({
    ...query,
    isActive: true,
  });
  return list(items, meta);
}

export async function publicGetCategory(request: FastifyRequest) {
  const { slug } = slugParamSchema.parse(request.params);
  return ok(await service.getCategoryBySlug(slug));
}

// ---- Admin ---------------------------------------------------------------

export async function adminListCategories(request: FastifyRequest) {
  const query = categoryListQuerySchema.parse(request.query);
  const { items, meta } = await service.listCategories(query);
  return list(items, meta);
}

export async function adminGetCategory(request: FastifyRequest) {
  const { id } = idParamSchema.parse(request.params);
  return ok(await service.getCategoryById(id));
}

export async function adminCreateCategory(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = categoryCreateSchema.parse(request.body);
  const category = await service.createCategory(input);
  return reply.status(201).send(ok(category));
}

export async function adminUpdateCategory(request: FastifyRequest) {
  const { id } = idParamSchema.parse(request.params);
  const input = categoryUpdateSchema.parse(request.body);
  return ok(await service.updateCategory(id, input));
}

export async function adminDeleteCategory(request: FastifyRequest) {
  const { id } = idParamSchema.parse(request.params);
  return ok(await service.deleteCategory(id));
}
