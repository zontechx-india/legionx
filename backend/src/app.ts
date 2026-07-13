import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { loggerConfig } from "./utils/logger.js";
import { registerPrisma } from "./plugins/prisma.js";
import { registerRoutes } from "./routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

/**
 * Builds and configures the Fastify application instance.
 *
 * Separated from `server.ts` (which owns the network lifecycle) so the same
 * app can be constructed for tests, scripts, or an eventual Socket.IO
 * attachment without opening a port.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerConfig,
    // Trust X-Forwarded-* headers — required behind Nginx / load balancers.
    trustProxy: true,
  });

  // ---------------------------------------------------------------------------
  // Core plugins
  // ---------------------------------------------------------------------------
  await app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  });

  // Database (decorates app.prisma, opens/closes the connection)
  await registerPrisma(app);

  // Future: await app.register(helmet);
  //         await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  //         await app.register(jwtPlugin);

  // ---------------------------------------------------------------------------
  // Consistent JSON error + 404 handling
  // ---------------------------------------------------------------------------
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  await registerRoutes(app);

  return app;
}
