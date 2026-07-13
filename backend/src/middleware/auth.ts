import type { FastifyRequest } from "fastify";
import { verifyToken } from "../utils/jwt.js";
import { HttpError } from "../utils/httpError.js";

// Authenticated principals attached to the request by the guards below.
declare module "fastify" {
  interface FastifyRequest {
    admin?: { id: string; role: string };
    customer?: { id: string };
  }
}

function getBearerToken(request: FastifyRequest): string {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw HttpError.unauthorized("Missing or malformed Authorization header");
  }
  return header.slice("Bearer ".length).trim();
}

/** Route guard: requires a valid **admin** token. Sets `request.admin`. */
export async function requireAdmin(request: FastifyRequest): Promise<void> {
  const claims = verifyToken(getBearerToken(request));
  if (claims.type !== "admin") {
    throw HttpError.forbidden("Admin access required");
  }
  request.admin = { id: claims.sub, role: claims.role };
}

/** Route guard: requires a valid **customer** token. Sets `request.customer`. */
export async function requireCustomer(request: FastifyRequest): Promise<void> {
  const claims = verifyToken(getBearerToken(request));
  if (claims.type !== "customer") {
    throw HttpError.forbidden("Customer access required");
  }
  request.customer = { id: claims.sub };
}
