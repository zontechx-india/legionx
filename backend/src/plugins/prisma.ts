import type { FastifyInstance } from "fastify";
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../config/prisma.js";

// Make `app.prisma` (and `request.server.prisma`) strongly typed everywhere.
declare module "fastify" {
  interface FastifyInstance {
    prisma: Prisma;
  }
}

/**
 * Attaches the Prisma client to the Fastify instance and ensures the DB
 * connection is opened on boot and cleanly closed on shutdown.
 *
 * Decorators added to the root instance are inherited by every child scope,
 * so all route handlers can use `request.server.prisma` / `app.prisma`.
 */
export async function registerPrisma(app: FastifyInstance): Promise<void> {
  await prisma.$connect();
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}
