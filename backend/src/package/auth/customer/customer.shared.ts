import { Prisma } from "../core/config/prisma.js";
import type { Principal } from "../core/authCore.types.js";

/**
 * Shared customer-auth pieces used by every strategy: the safe selection of
 * customer fields, the public shape returned to clients, and the strategy
 * result contract the controllers turn into a session.
 */

/** Internal select — includes `passwordHash` ONLY so it can be mapped to a boolean. */
export const customerAuthSelect = {
  id: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  passwordHash: true,
  name: true,
  avatarUrl: true,
  altPhone: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect;

type CustomerRow = Prisma.CustomerGetPayload<{ select: typeof customerAuthSelect }>;

/** What clients see — never the hash, just whether a password is set. */
export type PublicCustomer = Omit<CustomerRow, "passwordHash"> & {
  hasPassword: boolean;
};

export function toPublicCustomer(row: CustomerRow): PublicCustomer {
  const { passwordHash, ...rest } = row;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}

export function customerPrincipal(customerId: string): Principal {
  return { id: customerId, type: "customer" };
}

/**
 * Every login strategy — password, Google, phone OTP (and Apple later) —
 * resolves to this same result. The controller then calls `issueSession()`;
 * strategies never mint tokens, and the core never sees a credential.
 */
export interface CustomerAuthResult {
  principal: Principal;
  customer: PublicCustomer;
  isNewUser: boolean;
}
