import type { FastifyPluginAsync } from "fastify";

/**
 * Health module.
 *
 * Exposes a lightweight liveness/readiness probe used by load balancers,
 * container orchestrators, and uptime monitors. Kept dependency-free so it
 * stays green even when downstream services (DB, cache) are degraded.
 *
 * This file is also the reference template for every future feature module:
 * export a `FastifyPluginAsync` and register it in `src/routes.ts`.
 */
export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        // Response serialization schema keeps payloads fast and predictable.
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              uptime: { type: "number" },
              timestamp: { type: "string" },
            },
            required: ["status", "uptime", "timestamp"],
          },
        },
      },
    },
    async () => ({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
};
