import { and, eq } from "drizzle-orm";
import { getCategoryBySlug } from "@ns/shared";
import { db } from "../../db/client";
import { knowledgeBases, users } from "../../db/schema";
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
