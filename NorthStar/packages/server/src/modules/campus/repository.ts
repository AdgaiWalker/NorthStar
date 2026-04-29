import { and, eq, sql } from "drizzle-orm";
import { getCategoryBySlug, type ModerationTaskRecord, type SpaceClaimScanItem } from "@ns/shared";
import { db } from "../../db/client";
import { articles, knowledgeBases, moderationTasks, notifications, posts, users } from "../../db/schema";
import type { CampusModuleStatus, CreateCampusSpaceRequest, SiteContext, SpaceSummary } from "./types";

export function readCampusModuleStatus(): CampusModuleStatus {
  return { module: "campus", ready: true };
}

export async function createCampusSpace(
  site: SiteContext,
  ownerId: number,
  input: CreateCampusSpaceRequest,
): Promise<SpaceSummary | null | "duplicate"> {
  if (!db) return null;
  if (site !== "cn") return null;

  const existing = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.slug, input.slug))
    .limit(1);
  if (existing[0]) return "duplicate";

  const [space] = await db
    .insert(knowledgeBases)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description,
      category: input.category,
      ownerId,
      isClaimed: true,
      claimedBy: ownerId,
      articleCount: 0,
      favoriteCount: 0,
    })
    .returning({
      id: knowledgeBases.id,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      description: knowledgeBases.description,
      category: knowledgeBases.category,
      articleCount: knowledgeBases.articleCount,
      favoriteCount: knowledgeBases.favoriteCount,
      recentActiveAt: knowledgeBases.updatedAt,
    });

  if (!space) return null;

  const [owner] = await db
    .select({ id: users.id, name: users.nickname })
    .from(users)
    .where(and(eq(users.id, ownerId), eq(users.site, "cn")))
    .limit(1);

  return {
    id: space.slug,
    slug: space.slug,
    title: space.title,
    description: space.description ?? "",
    iconName: getCategoryBySlug(space.category ?? "")?.iconName ?? "BookOpen",
    category: space.category ?? "",
    articleCount: space.articleCount,
    helpfulCount: 0,
    favoriteCount: space.favoriteCount,
    recentActiveAt: space.recentActiveAt.toISOString(),
    maintainer: {
      id: owner ? String(owner.id) : String(ownerId),
      name: owner?.name ?? "空间维护者",
    },
  };
}

export async function canCreateCampusSpace(userId: number) {
  if (!db) return false;

  const rows = await db
    .select({
      role: users.role,
      trustLevel: users.trustLevel,
      site: users.site,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user || user.site !== "cn") return false;
  return user.role === "editor" || user.role === "admin" || user.trustLevel === "senior" || user.trustLevel === "admin";
}

export async function userExistsInCampus(userId: number) {
  if (!db) return false;

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.site, "cn")))
    .limit(1);

  return Boolean(rows[0]);
}

export async function scanStaleCampusSpacesForClaim(input: {
  candidateUserId: number;
  olderThanDays: number;
  limit: number;
}): Promise<{ items: SpaceClaimScanItem[]; skippedCount: number } | null> {
  if (!db) return null;

  const cutoff = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
  const spaces = await db
    .select({
      dbId: knowledgeBases.id,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      ownerId: knowledgeBases.ownerId,
      updatedAt: knowledgeBases.updatedAt,
    })
    .from(knowledgeBases)
    .orderBy(knowledgeBases.updatedAt)
    .limit(Math.min(Math.max(input.limit * 4, input.limit), 200));

  const items: SpaceClaimScanItem[] = [];
  let skippedCount = 0;

  for (const space of spaces) {
    if (items.length >= input.limit) break;
    if (space.ownerId === input.candidateUserId) {
      skippedCount += 1;
      continue;
    }

    const lastActiveAt = await readSpaceLastActiveAt(space.dbId, space.updatedAt);
    if (lastActiveAt > cutoff) {
      skippedCount += 1;
      continue;
    }

    const existing = await db
      .select({ id: moderationTasks.id })
      .from(moderationTasks)
      .where(
        and(
          eq(moderationTasks.site, "cn"),
          eq(moderationTasks.type, "space_claim"),
          eq(moderationTasks.status, "pending"),
          eq(moderationTasks.targetType, "space"),
          eq(moderationTasks.targetId, space.slug),
          sql`${moderationTasks.payload}->>'candidateUserId' = ${String(input.candidateUserId)}`,
        ),
      )
      .limit(1);

    if (existing[0]) {
      skippedCount += 1;
      continue;
    }

    const [task] = await db
      .insert(moderationTasks)
      .values({
        site: "cn",
        type: "space_claim",
        status: "pending",
        targetType: "space",
        targetId: space.slug,
        title: `空间认领：${space.title}`,
        reason: `${input.olderThanDays} 天未维护，建议重新确认维护者。`,
        payload: {
          spaceId: String(space.dbId),
          spaceSlug: space.slug,
          currentOwnerId: String(space.ownerId),
          candidateUserId: String(input.candidateUserId),
          lastActiveAt: lastActiveAt.toISOString(),
        },
      })
      .returning({ id: moderationTasks.id });

    if (!task) {
      skippedCount += 1;
      continue;
    }

    await db.insert(notifications).values({
      userId: input.candidateUserId,
      site: "cn",
      type: "claim",
      title: "空间可以认领",
      content: `空间 ${space.title} 已较久无人维护，你可以参与认领。`,
      relatedType: "space",
      relatedId: space.dbId,
    });

    items.push({
      taskId: String(task.id),
      spaceId: String(space.dbId),
      spaceSlug: space.slug,
      spaceTitle: space.title,
      currentOwnerId: String(space.ownerId),
      candidateUserId: String(input.candidateUserId),
      lastActiveAt: lastActiveAt.toISOString(),
    });
  }

  return { items, skippedCount };
}

export async function approveSpaceClaimTask(task: ModerationTaskRecord) {
  if (!db || task.type !== "space_claim") return null;

  const spaceSlug = stringPayload(task.payload, "spaceSlug") ?? task.targetId;
  const candidateUserId = numberPayload(task.payload, "candidateUserId");
  if (!spaceSlug || !candidateUserId) return null;

  const [before] = await db
    .select({
      id: knowledgeBases.id,
      slug: knowledgeBases.slug,
      ownerId: knowledgeBases.ownerId,
      claimedBy: knowledgeBases.claimedBy,
      isClaimed: knowledgeBases.isClaimed,
    })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.slug, spaceSlug))
    .limit(1);

  if (!before) return null;

  const [after] = await db
    .update(knowledgeBases)
    .set({
      ownerId: candidateUserId,
      claimedBy: candidateUserId,
      isClaimed: true,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeBases.slug, spaceSlug))
    .returning({
      id: knowledgeBases.id,
      slug: knowledgeBases.slug,
      ownerId: knowledgeBases.ownerId,
      claimedBy: knowledgeBases.claimedBy,
      isClaimed: knowledgeBases.isClaimed,
    });

  return after ? { before, after } : null;
}

async function readSpaceLastActiveAt(spaceId: number, fallback: Date) {
  if (!db) return fallback;

  const [articleActivity] = await db
    .select({ latestAt: sql<Date | null>`max(${articles.updatedAt})` })
    .from(articles)
    .where(eq(articles.kbId, spaceId));
  const [postActivity] = await db
    .select({ latestAt: sql<Date | null>`max(${posts.updatedAt})` })
    .from(posts)
    .where(eq(posts.kbId, spaceId));

  const values = [fallback, articleActivity?.latestAt, postActivity?.latestAt].filter(
    (value): value is Date => value instanceof Date,
  );

  return new Date(Math.max(...values.map((value) => value.getTime())));
}

function stringPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function numberPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}
