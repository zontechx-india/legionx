import type { FastifyRequest } from "fastify";
import { ok } from "../../utils/response.js";
import { searchQuerySchema } from "./discovery.schema.js";
import * as service from "./discovery.service.js";

/** Grouped platform search: `{ stores, categories, products }`. */
export async function search(request: FastifyRequest) {
  const query = searchQuerySchema.parse(request.query);
  return ok(await service.searchPlatform(query));
}

/** Marketplace trust counters: `{ stores, products }`. */
export async function stats() {
  return ok(await service.getPlatformStats());
}
