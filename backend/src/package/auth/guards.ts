import type { FastifyRequest } from "fastify";
import { authenticate, requirePrincipal } from "./core/guard.js";

/**
 * Route guards for this project's two principal kinds. The generic engine
 * (`core/guard`) provides `requirePrincipal`; this file binds it to admin /
 * customer and declares the request fields they set.
 */

// Authenticated principals attached to the request by the guards below.
declare module "fastify" {
  interface FastifyRequest {
    admin?: { id: string; role: string; sessionId?: string };
    customer?: { id: string; sessionId?: string };
  }
}

/** Requires a valid **admin** access token (bearer or cookie). Sets `request.admin`. */
export const requireAdmin = requirePrincipal("admin");

/** Requires a valid **customer** access token (bearer or cookie). Sets `request.customer`. */
export const requireCustomer = requirePrincipal("customer");

/**
 * Best-effort customer resolution for PUBLIC routes that grant owner-only
 * extras (e.g. the draft storefront preview): returns the customer id when the
 * request carries a valid customer access token, `undefined` otherwise — never
 * throws, so anonymous visitors pass through untouched.
 */
export function optionalCustomerId(
  request: FastifyRequest,
): string | undefined {
  try {
    const principal = authenticate(request, "customer");
    return principal.type === "customer" ? principal.id : undefined;
  } catch {
    return undefined;
  }
}
