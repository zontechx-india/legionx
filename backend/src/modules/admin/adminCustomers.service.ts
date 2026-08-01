import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/httpError.js";
import { buildListMeta } from "../../utils/response.js";
import { mediaUrl } from "../../package/storage/index.js";
import { revokeAllSessions } from "../../package/auth/index.js";
import { notify } from "../notifications/notifications.service.js";
import type { CustomerBlockInput, CustomerListQuery } from "./admin.schema.js";

/**
 * Customers, from the platform's side. A "seller" is not a separate account
 * type — it is a customer who owns at least one store — so this one screen
 * covers buyers and sellers, filtered.
 *
 * Nothing here exposes a credential: `passwordHash` is never selected, and
 * the only mutation is blocking.
 */

const listSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  blockedAt: true,
  blockedReason: true,
  createdAt: true,
  _count: { select: { stores: true, orders: true, addresses: true } },
} satisfies Prisma.CustomerSelect;

type CustomerRow = Prisma.CustomerGetPayload<{ select: typeof listSelect }>;

function shapeCustomer(row: CustomerRow) {
  const { _count, ...rest } = row;
  return {
    ...rest,
    counts: {
      stores: _count.stores,
      orders: _count.orders,
      addresses: _count.addresses,
    },
    isSeller: _count.stores > 0,
  };
}

export async function listCustomers(query: CustomerListQuery) {
  const where: Prisma.CustomerWhereInput = {};
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
      { phone: { contains: query.q } },
    ];
  }
  if (query.filter === "SELLERS") where.stores = { some: {} };
  if (query.filter === "BUYERS") where.stores = { none: {} };
  if (query.filter === "BLOCKED") where.blockedAt = { not: null };

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: listSelect,
    }),
  ]);

  return {
    rows: rows.map(shapeCustomer),
    meta: buildListMeta(total, query.page, query.pageSize),
  };
}

export async function getCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      ...listSelect,
      altPhone: true,
      stores: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          logoKey: true,
          isPublished: true,
          suspendedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!customer) throw HttpError.notFound("Customer not found");

  const [spend, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { customerId, status: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { placedAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        storeName: true,
        storeSlug: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        placedAt: true,
      },
    }),
  ]);

  const { stores, ...rest } = customer;
  return {
    ...shapeCustomer(rest as CustomerRow),
    stores: stores.map(({ logoKey, ...store }) => ({
      ...store,
      logoUrl: mediaUrl("logo", logoKey),
    })),
    spend: {
      orders: spend._count._all,
      total: spend._sum.total ?? new Prisma.Decimal(0),
    },
    recentOrders,
  };
}

/**
 * Block or unblock an account.
 *
 * Blocking is two actions in one, and both matter: the flag stops any future
 * sign-in (every strategy checks it — see `customer.shared.ts#authResult`),
 * and **every existing session is revoked** so a browser already holding a
 * refresh token can't simply carry on. Only the current 15-minute access
 * token outlives the block.
 */
export async function setBlocked(
  customerId: string,
  input: CustomerBlockInput,
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true, blockedAt: true },
  });
  if (!customer) throw HttpError.notFound("Customer not found");

  if ((customer.blockedAt !== null) === input.blocked) {
    throw HttpError.conflict(
      input.blocked
        ? "This account is already blocked"
        : "This account is not blocked",
    );
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: input.blocked
      ? { blockedAt: new Date(), blockedReason: input.reason ?? null }
      : { blockedAt: null, blockedReason: null },
  });

  let revokedSessions = 0;
  if (input.blocked) {
    revokedSessions = await revokeAllSessions(customerId, "customer");
  } else {
    notify({
      principalType: "CUSTOMER",
      principalId: customerId,
      kind: "ACCOUNT",
      title: "Account restored",
      body: "Your account has been unblocked. You can sign in again.",
    });
  }

  return { ...(await getCustomer(customerId)), revokedSessions };
}
