import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";

/**
 * Creates (or updates) an admin account.
 *
 *   npm run create-admin -- <email> <password> ["Full Name"]
 *
 * Or via env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
 * Re-running with the same email resets the password and re-activates it.
 */
async function main(): Promise<void> {
  const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
  const email = emailArg ?? process.env["ADMIN_EMAIL"];
  const password = passwordArg ?? process.env["ADMIN_PASSWORD"];
  const name = nameArg ?? process.env["ADMIN_NAME"];

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: npm run create-admin -- <email> <password> ["Full Name"]',
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, isActive: true, ...(name ? { name } : {}) },
    create: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      ...(name ? { name } : {}),
    },
    select: { email: true, role: true, name: true },
  });

  // eslint-disable-next-line no-console
  console.info(`✅ Admin ready: ${admin.email} (${admin.role})`);
  await prisma.$disconnect();
}

void main();
