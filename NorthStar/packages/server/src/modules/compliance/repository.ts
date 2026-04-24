import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AccountDeletionRequestRecord,
  AccountDeletionStatus,
  DataExportResponse,
  LegalDocumentRecord,
  SiteContext,
  UserConsentRecord,
} from "@ns/shared";
import { db } from "../../db/client";
import {
  accountDeletionRequests,
  articles,
  favorites,
  feedbacks,
  legalDocuments,
  posts,
  userConsents,
  users,
} from "../../db/schema";
import type { ComplianceModuleStatus } from "./types";

export function readComplianceModuleStatus(): ComplianceModuleStatus {
  return { module: "compliance", ready: true };
}

export async function listLegalDocuments(site: SiteContext, type?: string): Promise<LegalDocumentRecord[]> {
  if (!db) return [];

  const siteWhere = site === "all" ? sql`true` : eq(legalDocuments.site, site);
  const typeWhere = type ? eq(legalDocuments.type, type) : sql`true`;

  const rows = await db
    .select()
    .from(legalDocuments)
    .where(and(siteWhere, typeWhere))
    .orderBy(desc(legalDocuments.publishedAt));

  return rows.map(toLegalDocumentRecord);
}

export async function createUserConsent(userId: number, site: Exclude<SiteContext, "all">, version: string) {
  if (!db) return [];

  const rows = await db
    .insert(userConsents)
    .values([
      { userId, site, documentType: "terms", version },
      { userId, site, documentType: "privacy", version },
    ])
    .onConflictDoNothing()
    .returning();

  return rows.map(toUserConsentRecord);
}

export async function exportUserData(userId: number, site: Exclude<SiteContext, "all">): Promise<DataExportResponse | null> {
  if (!db) return null;

  const [userRows, consentRows, articleRows, postRows, feedbackRows, favoriteRows] = await Promise.all([
    db.select().from(users).where(and(eq(users.id, userId), eq(users.site, site))),
    db.select().from(userConsents).where(and(eq(userConsents.userId, userId), eq(userConsents.site, site))),
    db.select().from(articles).where(eq(articles.authorId, userId)),
    db.select().from(posts).where(eq(posts.authorId, userId)),
    db.select().from(feedbacks).where(eq(feedbacks.userId, userId)),
    db.select().from(favorites).where(eq(favorites.userId, userId)),
  ]);

  const user = userRows[0];
  if (!user) return null;

  return {
    userId: String(userId),
    site,
    exportedAt: new Date().toISOString(),
    payload: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.nickname,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      consents: consentRows.map(toUserConsentRecord),
      articles: articleRows.map((item) => ({ id: item.id, title: item.title, createdAt: item.createdAt.toISOString() })),
      posts: postRows.map((item) => ({ id: item.id, content: item.content, createdAt: item.createdAt.toISOString() })),
      feedbacks: feedbackRows.map((item) => ({ id: item.id, type: item.type, createdAt: item.createdAt.toISOString() })),
      favorites: favoriteRows.map((item) => ({ id: item.id, targetType: item.targetType, targetId: item.targetId })),
    },
  };
}

export async function createAccountDeletionRequest(
  userId: number,
  site: Exclude<SiteContext, "all">,
  reason?: string,
): Promise<AccountDeletionRequestRecord | null> {
  if (!db) return null;

  const [row] = await db
    .insert(accountDeletionRequests)
    .values({ userId, site, reason: reason?.trim() || null, status: "pending" })
    .returning();

  return toDeletionRecord(row);
}

export async function listAccountDeletionRequests(site: SiteContext): Promise<AccountDeletionRequestRecord[]> {
  if (!db) return [];

  const rows = await db
    .select()
    .from(accountDeletionRequests)
    .where(site === "all" ? sql`true` : eq(accountDeletionRequests.site, site))
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(100);

  return rows.map(toDeletionRecord);
}

export async function updateAccountDeletionRequestStatus(
  site: SiteContext,
  id: number,
  status: AccountDeletionStatus,
  handledBy: number | null,
) {
  if (!db) return null;

  const beforeRows = await db
    .select()
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.id, id), site === "all" ? sql`true` : eq(accountDeletionRequests.site, site)))
    .limit(1);

  const before = beforeRows[0];
  if (!before) return null;

  const [after] = await db
    .update(accountDeletionRequests)
    .set({
      status,
      handledBy,
      resolvedAt: status === "completed" || status === "rejected" ? new Date() : null,
    })
    .where(eq(accountDeletionRequests.id, id))
    .returning();

  return {
    before: toDeletionRecord(before),
    after: toDeletionRecord(after),
  };
}

function toLegalDocumentRecord(row: typeof legalDocuments.$inferSelect): LegalDocumentRecord {
  return {
    id: String(row.id),
    site: toSiteContext(row.site),
    type: row.type === "terms" ? "terms" : "privacy",
    version: row.version,
    title: row.title,
    content: row.content,
    publishedAt: row.publishedAt.toISOString(),
  };
}

function toUserConsentRecord(row: typeof userConsents.$inferSelect): UserConsentRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    site: row.site === "com" ? "com" : "cn",
    documentType: row.documentType === "terms" ? "terms" : "privacy",
    version: row.version,
    consentedAt: row.consentedAt.toISOString(),
  };
}

function toDeletionRecord(row: typeof accountDeletionRequests.$inferSelect): AccountDeletionRequestRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    site: row.site === "com" ? "com" : "cn",
    status: toDeletionStatus(row.status),
    reason: row.reason ?? undefined,
    requestedAt: row.requestedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
  };
}

function toDeletionStatus(value: string): AccountDeletionStatus {
  if (value === "in_review" || value === "processing" || value === "completed" || value === "rejected") return value;
  return "pending";
}

function toSiteContext(value: string): SiteContext {
  if (value === "com" || value === "all") return value;
  return "cn";
}
