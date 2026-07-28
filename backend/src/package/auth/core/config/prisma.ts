/**
 * DB access for the auth package — the **single** coupling to the host app's
 * database. Every file in the package imports `prisma` (and Prisma types) from
 * here, never from the app directly.
 *
 * When extracting the package into another project / microservice, repoint
 * these two lines at that project's PrismaClient — whose schema must include
 * the `AuthSession`, `Otp`, and `OAuthAccount` models.
 */
export { prisma } from "../../../../config/prisma.js";
export { Prisma } from "../../../../generated/prisma/client.js";
