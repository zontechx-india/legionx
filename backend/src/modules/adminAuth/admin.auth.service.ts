import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { verifyPassword } from "../../utils/password.js";
import { signAdminToken } from "../../utils/jwt.js";
import { HttpError } from "../../utils/httpError.js";
import type { AdminLoginInput } from "./admin.auth.schema.js";

const publicAdminSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.AdminSelect;

export async function login(input: AdminLoginInput) {
  const admin = await prisma.admin.findUnique({
    where: { email: input.email },
  });

  // Same error whether the email is unknown or the password is wrong — never
  // reveal which accounts exist.
  if (!admin || !admin.isActive) {
    throw HttpError.unauthorized("Invalid email or password");
  }

  const valid = await verifyPassword(input.password, admin.passwordHash);
  if (!valid) {
    throw HttpError.unauthorized("Invalid email or password");
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signAdminToken({ sub: admin.id, role: admin.role });
  const { passwordHash: _omit, ...safe } = admin;
  return { token, admin: safe };
}

export async function getProfile(id: string) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: publicAdminSelect,
  });
  if (!admin) throw HttpError.unauthorized("Admin account no longer exists");
  return admin;
}
