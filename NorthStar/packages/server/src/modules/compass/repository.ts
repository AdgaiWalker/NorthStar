import { and, desc, eq, or, sql } from "drizzle-orm";
import type {
  Article,
  CompassNewsRecord,
  CreateSolutionRequest,
  Domain,
  ExportFormat,
  SolutionFeedbackRequest,
  SolutionRecord,
  Tool,
  Topic,
  CompassFavoriteRecord,
} from "@ns/shared";
import { db } from "../../db/client";
import { compassFavorites, contentRecords, contentVersions, moderationTasks, solutionExports, solutionFeedbacks, solutions } from "../../db/schema";
import type { CompassModuleStatus } from "./types";

export function readCompassModuleStatus(): CompassModuleStatus {
  return { module: "compass", ready: true };
}

export async function listCompassTools() {
  const rows = await listPublishedContent("tool");
  return rows.map(toTool);
}

export async function getCompassTool(idOrSlug: string) {
  const row = await getPublishedContent("tool", idOrSlug);
  return row ? toTool(row) : null;
}

export async function listCompassTopics() {
  const rows = await listPublishedContent("topic");
  return rows.map(toTopic);
}

export async function getCompassTopic(idOrSlug: string) {
  const row = await getPublishedContent("topic", idOrSlug);
  return row ? toTopic(row) : null;
}

export async function listCompassArticles() {
  const rows = await listPublishedContent("article");
  return rows.map(toArticle);
}

export async function getCompassArticle(idOrSlug: string) {
  const row = await getPublishedContent("article", idOrSlug);
  return row ? toArticle(row) : null;
}

export async function listCompassNews() {
  const rows = await listPublishedContent("news");
  return rows.map(toNews);
}

export async function createCompassSolution(userId: number, input: CreateSolutionRequest) {
  if (!db) return null;

  const [row] = await db
    .insert(solutions)
    .values({
      site: "com",
      userId,
      title: input.title.trim(),
      targetGoal: input.targetGoal.trim(),
      toolIds: input.toolIds,
      content: input.content,
    })
    .returning();

  return row ? toSolution(row) : null;
}

export async function listCompassSolutions(userId: number) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(solutions)
    .where(and(eq(solutions.site, "com"), eq(solutions.userId, userId)))
    .orderBy(desc(solutions.createdAt))
    .limit(100);

  return rows.map(toSolution);
}

export async function getCompassSolution(userId: number, id: number) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(solutions)
    .where(and(eq(solutions.site, "com"), eq(solutions.userId, userId), eq(solutions.id, id)))
    .limit(1);

  return rows[0] ? toSolution(rows[0]) : null;
}

export async function deleteCompassSolution(userId: number, id: number) {
  if (!db) return null;

  const existing = await getCompassSolution(userId, id);
  if (!existing) return false;

  await db.delete(solutionFeedbacks).where(eq(solutionFeedbacks.solutionId, id));
  await db.delete(solutionExports).where(eq(solutionExports.solutionId, id));
  await db.delete(solutions).where(and(eq(solutions.userId, userId), eq(solutions.id, id)));
  return true;
}

export async function recordCompassSolutionExport(userId: number, id: number, format: ExportFormat) {
  if (!db) return null;

  const solution = await getCompassSolution(userId, id);
  if (!solution) return null;

  await db.insert(solutionExports).values({
    solutionId: id,
    userId,
    format,
  });

  return solution;
}

export async function recordCompassSolutionFeedback(userId: number, id: number, input: SolutionFeedbackRequest) {
  if (!db) return null;

  const solution = await getCompassSolution(userId, id);
  if (!solution) return null;

  const [row] = await db
    .insert(solutionFeedbacks)
    .values({
      solutionId: id,
      userId,
      helpful: input.helpful,
      note: input.note?.trim() || null,
    })
    .returning({
      id: solutionFeedbacks.id,
      helpful: solutionFeedbacks.helpful,
      note: solutionFeedbacks.note,
      createdAt: solutionFeedbacks.createdAt,
    });

  return row
    ? {
        id: String(row.id),
        solutionId: String(id),
        helpful: row.helpful,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      }
    : null;
}

export async function listCompassFavorites(userId: number) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(compassFavorites)
    .where(eq(compassFavorites.userId, userId))
    .orderBy(desc(compassFavorites.createdAt))
    .limit(200);

  return rows.map(toFavorite);
}

export async function createCompassFavorite(userId: number, targetType: string, targetId: string) {
  if (!db) return null;

  const existing = await db
    .select()
    .from(compassFavorites)
    .where(
      and(
        eq(compassFavorites.userId, userId),
        eq(compassFavorites.targetType, targetType),
        eq(compassFavorites.targetId, targetId),
      ),
    )
    .limit(1);
  if (existing[0]) return toFavorite(existing[0]);

  const [row] = await db
    .insert(compassFavorites)
    .values({
      userId,
      targetType,
      targetId,
    })
    .returning();

  return row ? toFavorite(row) : null;
}

export async function deleteCompassFavorite(userId: number, targetType: string, targetId: string) {
  if (!db) return null;

  await db
    .delete(compassFavorites)
    .where(
      and(
        eq(compassFavorites.userId, userId),
        eq(compassFavorites.targetType, targetType),
        eq(compassFavorites.targetId, targetId),
      ),
    );

  return true;
}

async function listPublishedContent(contentType: "tool" | "topic" | "article" | "news") {
  if (!db) return [];

  return db
    .select()
    .from(contentRecords)
    .where(and(eq(contentRecords.site, "com"), eq(contentRecords.contentType, contentType), eq(contentRecords.status, "published")))
    .orderBy(desc(contentRecords.publishedAt), desc(contentRecords.updatedAt))
    .limit(100);
}

export async function searchCompassContent(query: string) {
  if (!db) return { tools: [], topics: [], articles: [], news: [] };

  const pattern = `%${query.trim()}%`;
  const rows = await db
    .select()
    .from(contentRecords)
    .where(
      and(
        eq(contentRecords.site, "com"),
        eq(contentRecords.status, "published"),
        or(
          sql`${contentRecords.title} ilike ${pattern}`,
          sql`${contentRecords.summary} ilike ${pattern}`,
          sql`${contentRecords.body} ilike ${pattern}`,
        ),
      ),
    )
    .orderBy(desc(contentRecords.publishedAt))
    .limit(30);

  const tools = rows.filter((r) => r.contentType === "tool").map(toTool);
  const topics = rows.filter((r) => r.contentType === "topic").map(toTopic);
  const articles = rows.filter((r) => r.contentType === "article").map(toArticle);
  const news = rows.filter((r) => r.contentType === "news").map(toNews);

  return { tools, topics, articles, news };
}

async function getPublishedContent(contentType: "tool" | "topic" | "article" | "news", idOrSlug: string) {
  if (!db) return null;

  const numericId = Number(idOrSlug);
  const rows = await db
    .select()
    .from(contentRecords)
    .where(
      and(
        eq(contentRecords.site, "com"),
        eq(contentRecords.contentType, contentType),
        eq(contentRecords.status, "published"),
        Number.isInteger(numericId)
          ? or(eq(contentRecords.id, numericId), eq(contentRecords.slug, idOrSlug))
          : eq(contentRecords.slug, idOrSlug),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

function toTool(row: typeof contentRecords.$inferSelect): Tool {
  return {
    id: row.slug,
    name: row.title,
    description: row.summary,
    fullDescription: row.body,
    domain: toDomain(row.domain),
    tags: stringArray(row.metadata.tags),
    rating: numberValue(row.metadata.rating, 4.5),
    usageCount: stringValue(row.metadata.usageCount, "0"),
    imageUrl: stringValue(row.metadata.imageUrl, "https://picsum.photos/400/300?random=31"),
    url: stringValue(row.metadata.url, "#"),
    isFavorite: false,
  };
}

function toTopic(row: typeof contentRecords.$inferSelect): Topic {
  return {
    id: row.slug,
    title: row.title,
    description: row.summary,
    coverUrl: stringValue(row.metadata.coverUrl, "https://picsum.photos/400/300?random=32"),
    domain: toDomain(row.domain),
    articleCount: numberValue(row.metadata.articleCount, 0),
    rating: numberValue(row.metadata.rating, 4.5),
  };
}

function toArticle(row: typeof contentRecords.$inferSelect): Article {
  return {
    id: row.slug,
    topicId: nullableString(row.metadata.topicId),
    title: row.title,
    summary: row.summary,
    content: row.body,
    domain: toDomain(row.domain),
    author: stringValue(row.metadata.author, "盘根编辑"),
    authorLevel: stringValue(row.metadata.authorLevel, "certified") as Article["authorLevel"],
    date: row.publishedAt?.toISOString() ?? row.updatedAt.toISOString(),
    readTime: stringValue(row.metadata.readTime, "8 分钟"),
    relatedToolId: nullableString(row.metadata.relatedToolId),
    imageUrl: stringValue(row.metadata.imageUrl, "https://picsum.photos/800/400?random=33"),
    isVideo: Boolean(row.metadata.isVideo),
    isFeatured: Boolean(row.metadata.isFeatured),
    stats: {
      views: numberValue(row.metadata.views, 0),
      likes: numberValue(row.metadata.likes, 0),
      comments: numberValue(row.metadata.comments, 0),
    },
  };
}

function toNews(row: typeof contentRecords.$inferSelect): CompassNewsRecord {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    domain: toDomain(row.domain),
    source: stringValue(row.metadata.source, "盘根观察"),
    publishedAt: row.publishedAt?.toISOString() ?? row.updatedAt.toISOString(),
    url: nullableString(row.metadata.url) ?? undefined,
  };
}

function toSolution(row: typeof solutions.$inferSelect): SolutionRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    title: row.title,
    targetGoal: row.targetGoal,
    toolIds: Array.isArray(row.toolIds) ? row.toolIds.map(String) : [],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFavorite(row: typeof compassFavorites.$inferSelect): CompassFavoriteRecord {
  return {
    id: String(row.id),
    targetType: isFavoriteTargetType(row.targetType) ? row.targetType : "tool",
    targetId: row.targetId,
    createdAt: row.createdAt.toISOString(),
  };
}

function isFavoriteTargetType(value: string): value is CompassFavoriteRecord["targetType"] {
  return value === "tool" || value === "article" || value === "topic" || value === "news";
}

function toDomain(value: string | null): Domain {
  if (value === "dev" || value === "work") return value;
  return "creative";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// ─── Content Write Operations ───

export async function createContentRecord(input: {
  site: string;
  contentType: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  domain: string;
  metadata: Record<string, unknown>;
  status: string;
  ownerId: number | null;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(contentRecords)
    .values({
      site: input.site,
      contentType: input.contentType,
      slug: input.slug,
      title: input.title.trim(),
      summary: input.summary.trim(),
      body: input.body,
      domain: input.domain,
      metadata: input.metadata,
      status: input.status,
      ownerId: input.ownerId,
    })
    .returning();

  return row ?? null;
}

export async function updateContentRecord(
  id: number,
  input: {
    title?: string;
    summary?: string;
    body?: string;
    domain?: string;
    metadata?: Record<string, unknown>;
    status?: string;
  },
) {
  if (!db) return null;

  const before = await getContentRecordById(id);
  if (!before) return null;

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.summary !== undefined) updates.summary = input.summary.trim();
  if (input.body !== undefined) updates.body = input.body;
  if (input.domain !== undefined) updates.domain = input.domain;
  if (input.metadata !== undefined) updates.metadata = input.metadata;
  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status === "published") {
      updates.publishedAt = sql`NOW()`;
    }
  }

  if (Object.keys(updates).length === 0) return { before, after: before };

  const [updated] = await db
    .update(contentRecords)
    .set(updates)
    .where(eq(contentRecords.id, id))
    .returning();

  return updated ? { before, after: updated } : null;
}

export async function createContentVersion(input: {
  contentRecordId: number;
  version: number;
  snapshot: Record<string, unknown>;
  editorId: number | null;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(contentVersions)
    .values({
      contentRecordId: input.contentRecordId,
      version: input.version,
      snapshot: input.snapshot,
      editorId: input.editorId,
    })
    .returning();

  return row ?? null;
}

export async function getLatestVersionNumber(contentRecordId: number) {
  if (!db) return 0;

  const rows = await db
    .select({ version: contentVersions.version })
    .from(contentVersions)
    .where(eq(contentVersions.contentRecordId, contentRecordId))
    .orderBy(desc(contentVersions.version))
    .limit(1);

  return rows[0]?.version ?? 0;
}

export async function listContentVersions(contentRecordId: number) {
  if (!db) return [];

  return db
    .select()
    .from(contentVersions)
    .where(eq(contentVersions.contentRecordId, contentRecordId))
    .orderBy(desc(contentVersions.version))
    .limit(50);
}

export async function listAllContent(site: string | null, contentType?: string, status?: string) {
  if (!db) return [];

  const conditions = [];
  if (site) conditions.push(eq(contentRecords.site, site));
  if (contentType) conditions.push(eq(contentRecords.contentType, contentType));
  if (status) conditions.push(eq(contentRecords.status, status));

  return db
    .select()
    .from(contentRecords)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contentRecords.updatedAt))
    .limit(200);
}

export async function getContentRecordById(id: number) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(contentRecords)
    .where(eq(contentRecords.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function createModerationTask(input: {
  site: string;
  type: string;
  targetType: string;
  targetId: string;
  title: string;
  reason?: string;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(moderationTasks)
    .values({
      site: input.site,
      type: input.type,
      targetType: input.targetType,
      targetId: input.targetId,
      title: input.title,
      reason: input.reason ?? null,
    })
    .returning();

  return row ?? null;
}
