import type { FastifyRequest } from "fastify";
import { buildListMeta, list, ok } from "../../utils/response.js";
import { newProductsQuerySchema, searchQuerySchema } from "./discovery.schema.js";
import * as service from "./discovery.service.js";

/** Grouped platform search: `{ stores, categories, products }`. */
export async function search(request: FastifyRequest) {
  const query = searchQuerySchema.parse(request.query);
  return ok(await service.searchPlatform(query));
}

/** Newest discoverable products platform-wide (homepage rail). */
export async function newProducts(request: FastifyRequest) {
  const query = newProductsQuerySchema.parse(request.query);
  const { total, products } = await service.listNewProducts(query);
  return list(products, buildListMeta(total, query.page, query.pageSize));
}

/** Most common category names across published stores (homepage chips). */
export async function popularCategories() {
  return ok(await service.getPopularCategories());
}

/** Marketplace trust counters: `{ stores, products, orders }`. */
export async function stats() {
  return ok(await service.getPlatformStats());
}
