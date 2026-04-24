import { and, desc, eq, sql } from "drizzle-orm";
import type { AdminSummary, AuditLogRecord, SiteConfigRecord, SiteContext } from "@ns/shared";
import { db } from "../../db/client";
import { articles, auditLogs, moderationTasks, siteConfigs, users } from "../../db/schema";
import type { CreateAuditLogInput } from "./types";

export async function getAdminSummary(site: SiteContext): Promise<AdminSummary> {
  if (!db) {
    return {
      site,
      reviewPendingCount: 0,
      auditLogCount: 0,
      userCount: 0,
      contentCount: 0,
    };
  }

  const reviewWhere =
    site === "all" ? eq(moderationTasks.status, "pending") : and(eq(moderationTasks.site, site), eq(moderationTasks.status, "pending"));
  const auditWhere = site === "all" ? sql`true` : eq(auditLogs.site, site);
  const userWhere = site === "all" ? sql`true` : eq(users.site, site);

  const [reviewRows, auditRows, userRows, contentRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(moderationTasks).where(reviewWhere),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(auditWhere),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(userWhere),
    db.select({ count: sql<number>`count(*)::int` }).from(articles),
  ]);

  return {
    site,
    reviewPendingCount: reviewRows[0]?.count ?? 0,
    auditLogCount: auditRows[0]?.count ?? 0,
    userCount: userRows[0]?.count ?? 0,
    contentCount: contentRows[0]?.count ?? 0,
  };
}

export async function listAuditLogs(site: SiteContext): Promise<AuditLogRecord[]> {
  if (!db) return [];

  const rows = await db
    .select()
    .from(auditLogs)
    .where(site === "all" ? sql`true` : eq(auditLogs.site, site))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: String(row.id),
    actorId: row.actorId ? String(row.actorId) : null,
    site: toSiteContext(row.site),
    targetType: row.targetType,
    targetId: row.targetId,
    action: row.action,
    before: row.before ?? null,
    after: row.after ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listSiteConfigs(site: SiteContext): Promise<SiteConfigRecord[]> {
  if (!db) return [];

  const rows = await db
    .select()
    .from(siteConfigs)
    .where(site === "all" ? sql`true` : eq(siteConfigs.site, site))
    .orderBy(desc(siteConfigs.updatedAt));

  return rows.map((row) => ({
    id: String(row.id),
    site: toSiteContext(row.site),
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createAuditLog(input: CreateAuditLogInput) {
  if (!db) return null;

  const [row] = await db
    .insert(auditLogs)
    .values({
      actorId: input.actorId,
      site: input.site,
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      before: input.before ?? null,
      after: input.after ?? null,
    })
    .returning();

  return row;
}

function toSiteContext(value: string): SiteContext {
  if (value === "com" || value === "all") return value;
  return "cn";
}
