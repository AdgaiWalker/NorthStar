import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  AuditLogRecord,
  PlatformRole,
  SiteConfigRecord,
  SiteContext,
} from "@ns/shared";
import { db } from "../../db/client";
import { articles, auditLogs, contentRecords, contentVersions, moderationTasks, posts, siteConfigs, users } from "../../db/schema";
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

  const [reviewRows, auditRows, userRows, articleRows, postRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(moderationTasks).where(reviewWhere),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(auditWhere),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(userWhere),
    db.select({ count: sql<number>`count(*)::int` }).from(articles),
    db.select({ count: sql<number>`count(*)::int` }).from(posts),
  ]);

  return {
    site,
    reviewPendingCount: reviewRows[0]?.count ?? 0,
    auditLogCount: auditRows[0]?.count ?? 0,
    userCount: userRows[0]?.count ?? 0,
    contentCount: (articleRows[0]?.count ?? 0) + (postRows[0]?.count ?? 0),
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

export async function updateSiteConfig(
  site: SiteContext,
  id: number,
  value: Record<string, unknown>,
  actorId: number | null,
): Promise<{ before: SiteConfigRecord; after: SiteConfigRecord } | null> {
  if (!db) return null;

  const rows = await db
    .select()
    .from(siteConfigs)
    .where(and(eq(siteConfigs.id, id), site === "all" ? sql`true` : eq(siteConfigs.site, site)))
    .limit(1);
  const before = rows[0];
  if (!before) return null;

  const [after] = await db
    .update(siteConfigs)
    .set({ value, updatedBy: actorId, updatedAt: new Date() })
    .where(eq(siteConfigs.id, id))
    .returning();

  return {
    before: toSiteConfigRecord(before),
    after: toSiteConfigRecord(after),
  };
}

export async function listAdminUsers(site: SiteContext): Promise<AdminUserRecord[]> {
  if (!db) return [];

  const rows = await db
    .select()
    .from(users)
    .where(site === "all" ? sql`true` : eq(users.site, site))
    .orderBy(desc(users.createdAt))
    .limit(100);

  return rows.map(toAdminUserRecord);
}

export async function updateAdminUserRole(
  site: SiteContext,
  id: number,
  role: Exclude<PlatformRole, "visitor">,
): Promise<{ before: AdminUserRecord; after: AdminUserRecord } | null> {
  if (!db) return null;

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), site === "all" ? sql`true` : eq(users.site, site)))
    .limit(1);
  const before = rows[0];
  if (!before) return null;

  const [after] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return {
    before: toAdminUserRecord(before),
    after: toAdminUserRecord(after),
  };
}

export async function listAdminContent(site: SiteContext): Promise<AdminContentRecord[]> {
  if (!db) return [];
  if (site === "com") return [];

  const [articleRows, postRows] = await Promise.all([
    db.select().from(articles).orderBy(desc(articles.createdAt)).limit(50),
    db.select().from(posts).orderBy(desc(posts.createdAt)).limit(50),
  ]);

  return [
    ...articleRows.map((row): AdminContentRecord => ({
      id: String(row.id),
      site: "cn",
      type: "article",
      title: row.title,
      authorId: String(row.authorId),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
    ...postRows.map((row): AdminContentRecord => ({
      id: String(row.id),
      site: "cn",
      type: "post",
      title: row.title ?? row.content.slice(0, 40),
      authorId: String(row.authorId),
      status: row.solved ? "solved" : "open",
      createdAt: row.createdAt.toISOString(),
    })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100);
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

function toSiteConfigRecord(row: typeof siteConfigs.$inferSelect): SiteConfigRecord {
  return {
    id: String(row.id),
    site: toSiteContext(row.site),
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAdminUserRecord(row: typeof users.$inferSelect): AdminUserRecord {
  return {
    id: String(row.id),
    username: row.username,
    email: row.email ?? "",
    name: row.nickname,
    role: toAdminUserRole(row.role),
    site: toSiteContext(row.site),
    emailVerified: row.emailVerified,
    disabled: Boolean(row.disabledAt),
    createdAt: row.createdAt.toISOString(),
  };
}

function toAdminUserRole(value: string): AdminUserRecord["role"] {
  if (value === "editor" || value === "reviewer" || value === "operator" || value === "admin") return value;
  return "user";
}

export async function getContentQualityReport(site: SiteContext) {
  if (!db) {
    return { campus: { articlesByStatus: {}, articlesByKb: {}, avgHelpfulCount: 0 }, compass: { contentByType: {}, contentByStatus: {}, avgVersionCount: 0 } };
  }

  const campusSite = site === "all" || site === "cn";

  const campusArticlesByStatus = campusSite
    ? await db.select({ status: articles.status, count: sql<number>`count(*)::int` }).from(articles).groupBy(articles.status)
    : [];

  const campusArticlesByKb = campusSite
    ? await db.select({ kbId: articles.kbId, count: sql<number>`count(*)::int` }).from(articles).groupBy(articles.kbId)
    : [];

  const campusAvgHelpful = campusSite
    ? (await db.select({ avg: sql<number>`coalesce(avg(${articles.helpfulCount}), 0)` }).from(articles))[0]?.avg ?? 0
    : 0;

  const compassSite = site === "all" || site === "com";
  const compassWhere = site === "all" ? sql`true` : eq(contentRecords.site, "com");

  const compassContentByType = compassSite
    ? await db.select({ contentType: contentRecords.contentType, count: sql<number>`count(*)::int` }).from(contentRecords).where(compassWhere).groupBy(contentRecords.contentType)
    : [];

  const compassContentByStatus = compassSite
    ? await db.select({ status: contentRecords.status, count: sql<number>`count(*)::int` }).from(contentRecords).where(compassWhere).groupBy(contentRecords.status)
    : [];

  const compassAvgVersions = compassSite
    ? (await db.select({ avg: sql<number>`coalesce(avg(version_count), 0)` }).from(
        db.select({ contentRecordId: contentVersions.contentRecordId, version_count: sql<number>`count(*)::int` }).from(contentVersions).groupBy(contentVersions.contentRecordId).as("sub")
      ))[0]?.avg ?? 0
    : 0;

  return {
    campus: {
      articlesByStatus: Object.fromEntries(campusArticlesByStatus.map((r) => [r.status, r.count])),
      articlesByKb: Object.fromEntries(campusArticlesByKb.map((r) => [String(r.kbId), r.count])),
      avgHelpfulCount: Math.round(Number(campusAvgHelpful) * 100) / 100,
    },
    compass: {
      contentByType: Object.fromEntries(compassContentByType.map((r) => [r.contentType, r.count])),
      contentByStatus: Object.fromEntries(compassContentByStatus.map((r) => [r.status, r.count])),
      avgVersionCount: Math.round(Number(compassAvgVersions) * 100) / 100,
    },
  };
}
