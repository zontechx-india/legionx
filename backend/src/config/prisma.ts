import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

/**
 * Prisma client singleton.
 *
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 * We use the node-postgres adapter against the *pooled* Supabase connection
 * (DATABASE_URL, PgBouncer :6543) — migrations use DIRECT_URL via the CLI.
 */
if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set — cannot initialise the database client.",
  );
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });

export type Prisma = typeof prisma;
