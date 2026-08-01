import type { FastifyRequest } from "fastify";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { buildListMeta } from "../../utils/response.js";
import type { AuditListQuery } from "./admin.schema.js";

/**
 * The admin audit trail — an append-only record of who changed what.
 *
 * Every state-changing admin endpoint calls `recordAudit`. It is
 * fire-and-forget on purpose: an audit write must never fail the action it
 * describes (a suspended store staying suspended matters more than the log
 * line), and the row carries a snapshot of the actor's email so the trail
 * survives the admin account being deleted.
 */

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
}

/** The acting admin, resolved from the guard that already ran. */
async function actorEmail(adminId: string): Promise<string> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { email: true },
  });
  return admin?.email ?? "(deleted admin)";
}

export function recordAudit(request: FastifyRequest, entry: AuditEntry): void {
  const adminId = request.admin?.id;
  if (!adminId) return;

  void (async () => {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail: await actorEmail(adminId),
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        ...(entry.meta ? { meta: entry.meta as Prisma.InputJsonObject } : {}),
        ip: request.ip,
        userAgent: request.headers["user-agent"]?.slice(0, 255) ?? null,
      },
    });
  })().catch((err) => {
    console.error(`Audit write failed (${entry.action}):`, err);
  });
}

/** The trail, newest first — the console's Activity Log page. */
export async function listAudit(query: AuditListQuery) {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { rows, meta: buildListMeta(total, query.page, query.pageSize) };
}
