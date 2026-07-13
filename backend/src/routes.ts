import type { FastifyInstance } from "fastify";
import { requireAdmin } from "./middleware/auth.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { adminAuthRoutes } from "./modules/adminAuth/admin.auth.routes.js";
import {
  publicCategoryRoutes,
  adminCategoryRoutes,
} from "./modules/category/category.routes.js";
import {
  publicProductRoutes,
  adminProductRoutes,
} from "./modules/product/product.routes.js";

/**
 * Central route registrar.
 *
 * Root-level probes (health) live outside the versioned namespace so
 * monitoring URLs stay stable. Everything else mounts under /api/v1, split
 * into public (customer) and admin surfaces.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Infrastructure / probes — no version prefix.
  await app.register(healthRoutes);

  await app.register(
    async (api) => {
      // ---- Public (customer) ------------------------------------------
      await api.register(authRoutes, { prefix: "/auth" });
      await api.register(publicCategoryRoutes, { prefix: "/categories" });
      await api.register(publicProductRoutes, { prefix: "/products" });

      // ---- Admin ------------------------------------------------------
      await api.register(
        async (admin) => {
          // Auth is public (login) / self-guarded (me).
          await admin.register(adminAuthRoutes, { prefix: "/auth" });

          // Everything else under /admin requires a valid admin token.
          await admin.register(async (guarded) => {
            guarded.addHook("preHandler", requireAdmin);
            await guarded.register(adminCategoryRoutes, { prefix: "/categories" });
            await guarded.register(adminProductRoutes, { prefix: "/products" });
          });
        },
        { prefix: "/admin" },
      );
    },
    { prefix: "/api/v1" },
  );
}
