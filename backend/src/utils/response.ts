/**
 * Standard API response envelope so every endpoint returns a predictable shape.
 *
 *   success: { success: true, data, meta? }
 *   error:   { success: false, statusCode, error, message, issues? }
 */

export interface ListMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ok<T>(data: T) {
  return { success: true as const, data };
}

export function list<T>(data: T[], meta: ListMeta) {
  return { success: true as const, data, meta };
}

export function buildListMeta(
  total: number,
  page: number,
  pageSize: number,
): ListMeta {
  return {
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}
