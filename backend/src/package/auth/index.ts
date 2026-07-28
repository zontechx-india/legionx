import type { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";

/**
 * Public facade for the auth package.
 *
 * The rest of the app imports **only from here** — never reaching into
 * `core/`, `providers/`, `customer/`, or `admin/` directly. This single seam
 * is what you sever when auth becomes a standalone service: swap these exports
 * for a client (HTTP calls + a token-verifying guard) and nothing else in the
 * app changes.
 *
 * Internals (token engine, session store, verification engine, provider
 * registry, login strategies) stay private.
 */

// Route trees — mounted by the app under their prefixes.
export { authRoutes } from "./customer/customer.routes.js"; // customer: password + Google + OTP (web + mobile)
export { adminAuthRoutes } from "./admin/admin.routes.js"; // admin: password (web + mobile)

// Guards — for protecting non-auth routes elsewhere in the app.
// `optionalCustomerId` is the no-throw variant for public routes that grant
// owner-only extras (e.g. the draft storefront preview).
export { optionalCustomerId, requireAdmin, requireCustomer } from "./guards.js";

/**
 * Registers the plugins the auth package needs. Currently just cookie parsing
 * (web clients authenticate via httpOnly cookies). Call once at app boot.
 */
export async function registerAuthPlugins(app: FastifyInstance): Promise<void> {
  await app.register(cookie);
}
