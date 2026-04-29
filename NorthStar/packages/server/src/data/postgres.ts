import {
  getCategoryBySlug,
  type ArticleDetail,
  type ArticleSummary,
  type ChangeFeedback,
  type FavoriteRecord,
  type FrontlifeFeedItem,
  type NotificationRecord,
  type PostRecord,
  type PostReplyRecord,
  type ProfileResponse,
  type SearchLogRecord,
  type SearchResponse,
  type SpaceSummary,
} from "@ns/shared";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getHigherTrustLevel, getTrustLevelFromScore } from "../lib/permissions";
import { db } from "../db/client";
import {
  activities,
  articles,
  favorites,
  feedbacks,
  knowledgeBases,
  notifications,
  postReplies,
  posts,
  reports,
  searchDocuments,
  searchLogs,
  trustEvents,
  users,
} from "../db/schema";

export async function listSpacesFromDb() {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: knowledgeBases.id,
      id: knowledgeBases.slug,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      description: knowledgeBases.description,
      category: knowledgeBases.category,
      articleCount: knowledgeBases.articleCount,
      favoriteCount: knowledgeBases.favoriteCount,
      recentActiveAt: knowledgeBases.updatedAt,
      maintainerId: users.id,
      maintainerName: users.nickname,
      helpfulCount: sql<number>`coalesce(sum(${articles.helpfulCount}), 0)`,
    })
    .from(knowledgeBases)
    .leftJoin(users, eq(knowledgeBases.ownerId, users.id))
    .leftJoin(articles, eq(articles.kbId, knowledgeBases.id))
    .groupBy(
      knowledgeBases.id,
      knowledgeBases.slug,
      knowledgeBases.title,
      knowledgeBases.description,
      knowledgeBases.category,
      knowledgeBases.articleCount,
      knowledgeBases.favoriteCount,
      knowledgeBases.updatedAt,
      users.id,
      users.nickname,
    )
    .orderBy(desc(knowledgeBases.updatedAt));

  return rows.map(mapSpaceRow);
}

export async function getSpaceDetailFromDb(spaceSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: knowledgeBases.id,
      id: knowledgeBases.slug,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      description: knowledgeBases.description,
      category: knowledgeBases.category,
      articleCount: knowledgeBases.articleCount,
      favoriteCount: knowledgeBases.favoriteCount,
      recentActiveAt: knowledgeBases.updatedAt,
      maintainerId: users.id,
      maintainerName: users.nickname,
      helpfulCount: sql<number>`coalesce(sum(${articles.helpfulCount}), 0)`,
    })
    .from(knowledgeBases)
    .leftJoin(users, eq(knowledgeBases.ownerId, users.id))
    .leftJoin(articles, eq(articles.kbId, knowledgeBases.id))
    .where(eq(knowledgeBases.slug, spaceSlug))
    .groupBy(
      knowledgeBases.id,
      knowledgeBases.slug,
      knowledgeBases.title,
      knowledgeBases.description,
      knowledgeBases.category,
      knowledgeBases.articleCount,
      knowledgeBases.favoriteCount,
      knowledgeBases.updatedAt,
      users.id,
      users.nickname,
    );

  const space = rows[0];
  if (!space) return null;

  const articleRows = await db
    .select({
      dbId: articles.id,
      slug: articles.slug,
      parentDbId: articles.parentId,
      title: articles.title,
      content: articles.content,
      helpfulCount: articles.helpfulCount,
      changedCount: articles.changedCount,
      readCount: articles.readCount,
      favoriteCount: articles.favoriteCount,
      confirmedAt: articles.confirmedAt,
      updatedAt: articles.updatedAt,
      sortOrder: articles.sortOrder,
    })
    .from(articles)
    .where(eq(articles.kbId, space.dbId))
    .orderBy(asc(articles.sortOrder), desc(articles.updatedAt));

  const idToSlug = new Map(articleRows.map((row) => [row.dbId, row.slug]));

  return {
    space: mapSpaceRow(space),
    articles: articleRows.map((row) => ({
      id: row.slug,
      slug: row.slug,
      spaceId: space.id,
      parentId: row.parentDbId ? idToSlug.get(row.parentDbId) ?? null : null,
      title: row.title,
      summary: summarizeContent(row.content),
      helpfulCount: row.helpfulCount,
      changedCount: row.changedCount,
      readCount: row.readCount,
      favoriteCount: row.favoriteCount,
      confirmedAt: toIso(row.confirmedAt),
      updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    }) satisfies ArticleSummary),
  };
}

export async function getArticleDetailFromDb(articleSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: articles.id,
      slug: articles.slug,
      title: articles.title,
      content: articles.content,
      helpfulCount: articles.helpfulCount,
      changedCount: articles.changedCount,
      readCount: articles.readCount,
      favoriteCount: articles.favoriteCount,
      confirmedAt: articles.confirmedAt,
      updatedAt: articles.updatedAt,
      authorId: users.id,
      authorName: users.nickname,
      spaceDbId: knowledgeBases.id,
      spaceSlug: knowledgeBases.slug,
      spaceTitle: knowledgeBases.title,
      spaceCategory: knowledgeBases.category,
    })
    .from(articles)
    .innerJoin(users, eq(articles.authorId, users.id))
    .innerJoin(knowledgeBases, eq(articles.kbId, knowledgeBases.id))
    .where(eq(articles.slug, articleSlug));

  const articleRow = rows[0];
  if (!articleRow) return null;

  // 查询作者累计被确认有帮助数
  const authorStatsRow = await db
    .select({
      helpedCount: sql<number>`coalesce(sum(${articles.helpfulCount}), 0)`,
    })
    .from(articles)
    .where(eq(articles.authorId, articleRow.authorId));

  const authorHelpedCount = Number(authorStatsRow[0]?.helpedCount ?? 0);

  const siblings = await db
    .select({
      slug: articles.slug,
    })
    .from(articles)
    .where(eq(articles.kbId, articleRow.spaceDbId))
    .orderBy(asc(articles.sortOrder), desc(articles.updatedAt));

  const index = siblings.findIndex((item) => item.slug === articleSlug);

  const changeRows = await db
    .select({
      id: feedbacks.id,
      note: feedbacks.changedNote,
      createdAt: feedbacks.createdAt,
    })
    .from(feedbacks)
    .where(
      and(
        eq(feedbacks.targetType, "article"),
        eq(feedbacks.targetId, articleRow.dbId),
        eq(feedbacks.type, "changed"),
      ),
    )
    .orderBy(desc(feedbacks.createdAt));

  return {
    article: {
      id: articleRow.slug,
      slug: articleRow.slug,
      spaceId: articleRow.spaceSlug,
      parentId: null,
      title: articleRow.title,
      summary: summarizeContent(articleRow.content),
      content: articleRow.content,
      helpfulCount: articleRow.helpfulCount,
      changedCount: articleRow.changedCount,
      readCount: articleRow.readCount,
      favoriteCount: articleRow.favoriteCount,
      confirmedAt: toIso(articleRow.confirmedAt),
      updatedAt: toIso(articleRow.updatedAt) ?? new Date().toISOString(),
      author: {
        id: String(articleRow.authorId),
        name: articleRow.authorName,
        helpedCount: authorHelpedCount,
      },
      space: {
        id: articleRow.spaceSlug,
        title: articleRow.spaceTitle,
        iconName: categoryToIcon(articleRow.spaceCategory),
      },
      changeNotes: changeRows.map((item) => ({
        id: String(item.id),
        articleId: articleRow.slug,
        note: item.note ?? "",
        createdAt: toIso(item.createdAt) ?? new Date().toISOString(),
      }) satisfies ChangeFeedback),
    } satisfies ArticleDetail,
    previousArticleId: index > 0 ? siblings[index - 1].slug : null,
    nextArticleId: index >= 0 && index < siblings.length - 1 ? siblings[index + 1].slug : null,
  };
}

export async function createArticleInDb(
  userId: number,
  input: {
    spaceId: string;
    title: string;
    content: string;
  },
) {
  if (!db) return null;

  const space = await resolveSpaceBySlug(input.spaceId);
  if (!space) return null;

  const slugBase = slugify(input.title) || `article-${Date.now()}`;
  let slug = slugBase;
  let suffix = 1;

  while (await resolveArticleBySlug(slug)) {
    suffix += 1;
    slug = `${slugBase}-${suffix}`;
  }

  const [sortRow] = await db
    .select({
      nextSortOrder: sql<number>`coalesce(max(${articles.sortOrder}), 0) + 1`,
    })
    .from(articles)
    .where(eq(articles.kbId, space.dbId));

  const [created] = await db
    .insert(articles)
    .values({
      kbId: space.dbId,
      title: input.title,
      slug,
      content: input.content,
      authorId: userId,
      status: "published",
      sortOrder: sortRow?.nextSortOrder ?? 1,
    })
    .returning({
      id: articles.id,
      slug: articles.slug,
    });

  if (!created) return null;

  await db
    .update(knowledgeBases)
    .set({
      articleCount: sql`${knowledgeBases.articleCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeBases.id, space.dbId));

  await insertActivity("article", created.id, "update", userId);
  await createNotificationInDb(userId, "feedback", "文章已发布", input.title, "article", created.id);

  const detail = await getArticleDetailFromDb(created.slug);
  return detail?.article ?? null;
}

export async function listPostsBySpaceFromDb(spaceSlug: string) {
  if (!db) return null;

  const space = await resolveSpaceBySlug(spaceSlug);
  if (!space) return null;

  const postRows = await db
    .select({
      dbId: posts.id,
      content: posts.content,
      tags: posts.tags,
      helpfulCount: posts.favoriteCount,
      replyCount: posts.replyCount,
      solved: posts.solved,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.nickname,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.kbId, space.dbId))
    .orderBy(desc(posts.createdAt));

  const postIds = postRows.map((row) => row.dbId);
  const replyRows = postIds.length
    ? await db
        .select({
          id: postReplies.id,
          postId: postReplies.postId,
          content: postReplies.content,
          starCount: postReplies.starCount,
          createdAt: postReplies.createdAt,
          authorId: users.id,
          authorName: users.nickname,
        })
        .from(postReplies)
        .innerJoin(users, eq(postReplies.authorId, users.id))
        .where(inArray(postReplies.postId, postIds))
        .orderBy(desc(postReplies.createdAt))
    : [];

  const repliesByPostId = new Map<number, PostReplyRecord[]>();
  for (const reply of replyRows) {
    const current = repliesByPostId.get(reply.postId) ?? [];
    current.push({
      id: String(reply.id),
      postId: String(reply.postId),
      content: reply.content,
      author: {
        id: String(reply.authorId),
        name: reply.authorName,
      },
      starCount: reply.starCount,
      createdAt: toIso(reply.createdAt) ?? new Date().toISOString(),
    });
    repliesByPostId.set(reply.postId, current);
  }

  return postRows.map((row) => ({
    id: String(row.dbId),
    spaceId: space.slug,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    author: {
      id: String(row.authorId),
      name: row.authorName,
    },
    helpfulCount: row.helpfulCount,
    replyCount: row.replyCount,
    solved: row.solved,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    replies: repliesByPostId.get(row.dbId) ?? [],
  }) satisfies PostRecord);
}

export async function createPostInDb(input: {
  spaceId?: string;
  content: string;
  tags?: string[];
  userId: number;
}) {
  if (!db) return null;

  const space = await resolveSpaceBySlug(input.spaceId ?? "freeboard");
  if (!space) return null;

  const [created] = await db
    .insert(posts)
    .values({
      kbId: space.dbId,
      content: input.content,
      tags: input.tags?.length ? input.tags : ["share"],
      authorId: input.userId,
      solved: false,
    })
    .returning({ id: posts.id });

  if (!created) return null;
  await recordTrustEvent(input.userId, "post_created", 10, "post", created.id);
  return getPostById(created.id, space.slug);
}

export async function createReplyInDb(postId: string, content: string, userId: number, userName: string) {
  if (!db) return null;

  const numericPostId = Number(postId);
  if (!Number.isFinite(numericPostId)) return null;

  const [targetPost] = await db
    .select({
      authorId: posts.authorId,
    })
    .from(posts)
    .where(eq(posts.id, numericPostId));

  if (!targetPost) return null;

  const [reply] = await db
    .insert(postReplies)
    .values({
      postId: numericPostId,
      content,
      authorId: userId,
      starCount: 0,
    })
    .returning({
      id: postReplies.id,
      postId: postReplies.postId,
      content: postReplies.content,
      starCount: postReplies.starCount,
      createdAt: postReplies.createdAt,
    });

  if (!reply) return null;

  await db
    .update(posts)
    .set({
      replyCount: sql`${posts.replyCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, numericPostId));

  await insertActivity("post", numericPostId, "reply", userId);
  if (targetPost.authorId !== userId) {
    await createNotificationInDb(targetPost.authorId, "reply", "有人回复了帖子", content, "post", numericPostId);
  }

  return {
    id: String(reply.id),
    postId: String(reply.postId),
    content: reply.content,
    author: {
      id: String(userId),
      name: userName,
    },
    starCount: reply.starCount,
    createdAt: toIso(reply.createdAt) ?? new Date().toISOString(),
  } satisfies PostReplyRecord;
}

export async function updatePostInDb(postId: string, updates: { title?: string; content?: string }, userId: number) {
  if (!db) return null;

  const numericPostId = Number(postId);
  if (!Number.isFinite(numericPostId)) return null;

  const [existing] = await db
    .select({ authorId: posts.authorId, kbSlug: knowledgeBases.slug })
    .from(posts)
    .leftJoin(knowledgeBases, eq(posts.kbId, knowledgeBases.id))
    .where(eq(posts.id, numericPostId));

  if (!existing) return null;
  if (existing.authorId !== userId) return null;

  const [updated] = await db
    .update(posts)
    .set({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content }),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, numericPostId))
    .returning({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      tags: posts.tags,
      solved: posts.solved,
      favoriteCount: posts.favoriteCount,
      replyCount: posts.replyCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    });

  if (!updated) return null;
  await insertActivity("post", numericPostId, "update", userId);

  return getPostById(updated.id, existing.kbSlug ?? "");
}

export async function markPostSolvedInDb(postId: string, userId: number) {
  if (!db) return null;

  const numericPostId = Number(postId);
  if (!Number.isFinite(numericPostId)) return null;

  const [updated] = await db
    .update(posts)
    .set({
      solved: true,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, numericPostId))
    .returning({ id: posts.id, solved: posts.solved });

  if (!updated) return null;
  await insertActivity("post", numericPostId, "update", userId);
  await recordTrustEvent(userId, "help_solved", 5, "post", numericPostId);

  return {
    id: String(updated.id),
    solved: updated.solved,
  };
}

export async function markArticleHelpfulInDb(articleSlug: string, userId: number) {
  if (!db) return null;

  const article = await resolveArticleBySlug(articleSlug);
  if (!article) return null;

  await db.insert(feedbacks).values({
    targetType: "article",
    targetId: article.id,
    userId,
    type: "helpful",
  });

  const [updated] = await db
    .update(articles)
    .set({
      helpfulCount: sql`${articles.helpfulCount} + 1`,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, article.id))
    .returning({
      helpfulCount: articles.helpfulCount,
      confirmedAt: articles.confirmedAt,
    });

  await insertActivity("article", article.id, "helpful", userId);
  if (article.authorId !== userId) {
    await createNotificationInDb(article.authorId, "feedback", "内容被确认有帮助", article.slug, "article", article.id);
  }
  await recordTrustEvent(article.authorId, "article_helpful", 3, "article", article.id);

  return updated
    ? {
        articleId: article.slug,
        helpfulCount: updated.helpfulCount,
        confirmedAt: toIso(updated.confirmedAt),
      }
    : null;
}

export async function markArticleChangedInDb(articleSlug: string, note: string, userId: number) {
  if (!db) return null;

  const article = await resolveArticleBySlug(articleSlug);
  if (!article) return null;

  const [feedback] = await db
    .insert(feedbacks)
    .values({
    targetType: "article",
    targetId: article.id,
    userId,
    type: "changed",
    changedNote: note,
  })
    .returning({
      id: feedbacks.id,
      createdAt: feedbacks.createdAt,
    });

  const [updated] = await db
    .update(articles)
    .set({
      changedCount: sql`${articles.changedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, article.id))
    .returning({
      changedCount: articles.changedCount,
    });

  await insertActivity("article", article.id, "changed", userId);

  if (!feedback || !updated) return null;

  return {
    articleId: article.slug,
    changedCount: updated.changedCount,
    feedback: {
      id: String(feedback.id),
      articleId: article.slug,
      note,
      createdAt: toIso(feedback.createdAt) ?? new Date().toISOString(),
    } satisfies ChangeFeedback,
  };
}

export async function updateArticleInDb(
  articleSlug: string,
  updates: { title?: string; content?: string; summary?: string },
  userId: number,
) {
  if (!db) return null;

  const article = await resolveArticleBySlug(articleSlug);
  if (!article) return null;

  const space = await db
    .select({ ownerId: knowledgeBases.ownerId })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.id, article.kbId))
    .limit(1);

  const isMaintainer = space[0]?.ownerId === userId;
  if (article.authorId !== userId && !isMaintainer) return null;

  const [updated] = await db
    .update(articles)
    .set({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.summary !== undefined && { summary: updates.summary }),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, article.id))
    .returning({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      content: articles.content,
      helpfulCount: articles.helpfulCount,
      changedCount: articles.changedCount,
      readCount: articles.readCount,
      favoriteCount: articles.favoriteCount,
      confirmedAt: articles.confirmedAt,
      updatedAt: articles.updatedAt,
    });

  if (!updated) return null;
  await insertActivity("article", article.id, "update", userId);

  const detail = await getArticleDetailFromDb(updated.slug);
  return detail?.article ?? null;
}

export async function resolveArticleChangedInDb(articleSlug: string, userId: number) {
  if (!db) return null;

  const article = await resolveArticleBySlug(articleSlug);
  if (!article) return null;
  if (article.authorId !== userId) return null;

  const [updated] = await db
    .update(articles)
    .set({
      changedCount: 0,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, article.id))
    .returning({
      id: articles.id,
      changedCount: articles.changedCount,
      confirmedAt: articles.confirmedAt,
    });

  return updated ? { articleId: articleSlug, resolved: true } : null;
}

export async function listNotificationsFromDb(userId: number, site: "cn" | "com") {
  if (!db) return null;

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      content: notifications.content,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.site, site)))
    .orderBy(desc(notifications.createdAt));

  return rows.map((row) => ({
    id: String(row.id),
    type: row.type,
    title: row.title,
    content: row.content ?? "",
    isRead: row.isRead,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  }) satisfies NotificationRecord);
}

export async function createAuthInviteNotificationInDb(userId: number) {
  await createNotificationInDb(
    userId,
    "auth_invite",
    "你可以申请认证作者",
    "你的贡献已经满足认证作者邀请条件，可以开始整理更系统的长文章。",
    "user",
    userId,
  );
}

export async function createContentExpiryNotificationInDb(userId: number, articleSlug: string) {
  const article = await resolveArticleBySlug(articleSlug);
  if (!article) return null;

  await createNotificationInDb(
    userId,
    "expiry",
    "文章需要重新确认",
    `文章 ${articleSlug} 已较久未确认，请检查内容是否仍然准确。`,
    "article",
    article.id,
  );

  return article;
}

export async function createArticleChangedNotificationInDb(articleSlug: string, note: string) {
  const article = await resolveArticleBySlug(articleSlug);
  if (!article) return null;

  await createNotificationInDb(
    article.authorId,
    "changed",
    "有人反馈内容有变化",
    note,
    "article",
    article.id,
  );

  return article;
}

export async function createSpaceClaimNotificationInDb(userId: number, spaceSlug: string) {
  const space = await resolveSpaceBySlug(spaceSlug);
  if (!space) return null;

  await createNotificationInDb(
    userId,
    "claim",
    "空间可以认领",
    `空间 ${space.title} 需要新的维护者，你可以参与认领。`,
    "space",
    space.dbId,
  );

  return space;
}

export async function markNotificationReadInDb(id: string, userId: number, site: "cn" | "com") {
  if (!db) return null;

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, numericId), eq(notifications.userId, userId), eq(notifications.site, site)))
    .returning({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      content: notifications.content,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    });

  return updated
    ? ({
        id: String(updated.id),
        type: updated.type,
        title: updated.title,
        content: updated.content ?? "",
        isRead: updated.isRead,
        createdAt: toIso(updated.createdAt) ?? new Date().toISOString(),
      } satisfies NotificationRecord)
    : null;
}

export async function createFavoriteInDb(userId: number, input: { targetType: "article" | "space"; targetId: string }) {
  if (!db) return null;

  const target =
    input.targetType === "article"
      ? await resolveFavoriteArticle(input.targetId)
      : await resolveFavoriteSpace(input.targetId);

  if (!target) return null;

  const targetType = input.targetType === "article" ? "article" : "space";
  const existing = await db
    .select({
      id: favorites.id,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.targetType, targetType),
        eq(favorites.targetId, target.dbId),
      ),
    );

  if (existing[0]) {
    return {
      id: String(existing[0].id),
      targetType,
      targetId: input.targetId,
      title: target.title,
      createdAt: toIso(existing[0].createdAt) ?? new Date().toISOString(),
    } satisfies FavoriteRecord;
  }

  const [favorite] = await db
    .insert(favorites)
    .values({
      userId,
      targetType,
      targetId: target.dbId,
    })
    .returning({
      id: favorites.id,
      createdAt: favorites.createdAt,
    });

  if (target.ownerId !== userId) {
    await createNotificationInDb(target.ownerId, "feedback", "内容被收藏", target.title, targetType, target.dbId);
  }
  await recordTrustEvent(target.ownerId, "content_favorited", 1, targetType, target.dbId);

  return favorite
    ? ({
        id: String(favorite.id),
        targetType,
        targetId: input.targetId,
        title: target.title,
        createdAt: toIso(favorite.createdAt) ?? new Date().toISOString(),
      } satisfies FavoriteRecord)
    : null;
}

export async function getProfileFromDb(userId: number) {
  if (!db) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.nickname,
      school: users.school,
      trustLevel: users.trustLevel,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return null;

  const ownedSpaces = await db
    .select({
      dbId: knowledgeBases.id,
      id: knowledgeBases.slug,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      description: knowledgeBases.description,
      category: knowledgeBases.category,
      articleCount: knowledgeBases.articleCount,
      favoriteCount: knowledgeBases.favoriteCount,
      recentActiveAt: knowledgeBases.updatedAt,
      helpfulCount: sql<number>`0`,
    })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.ownerId, userId))
    .orderBy(desc(knowledgeBases.updatedAt));

  const articleContents = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      summary: articles.content,
      helpfulCount: articles.helpfulCount,
      changedCount: articles.changedCount,
      readCount: articles.readCount,
      favoriteCount: articles.favoriteCount,
      confirmedAt: articles.confirmedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.authorId, userId))
    .orderBy(desc(articles.updatedAt))
    .limit(3);

  const postContents = await db
    .select({
      id: posts.id,
      kbId: posts.kbId,
      content: posts.content,
      tags: posts.tags,
      replyCount: posts.replyCount,
      favoriteCount: posts.favoriteCount,
      solved: posts.solved,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.authorId, userId))
    .orderBy(desc(posts.updatedAt))
    .limit(3);

  const favoriteRows = await db
    .select({
      id: favorites.id,
      targetType: favorites.targetType,
      targetId: favorites.targetId,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  const articleIds = favoriteRows.filter((row) => row.targetType === "article").map((row) => row.targetId);
  const spaceIds = favoriteRows.filter((row) => row.targetType === "space").map((row) => row.targetId);
  const favoriteArticles = articleIds.length
    ? await db
        .select({ id: articles.id, slug: articles.slug, title: articles.title })
        .from(articles)
        .where(inArray(articles.id, articleIds))
    : [];
  const favoriteSpaces = spaceIds.length
    ? await db
        .select({ id: knowledgeBases.id, slug: knowledgeBases.slug, title: knowledgeBases.title })
        .from(knowledgeBases)
        .where(inArray(knowledgeBases.id, spaceIds))
    : [];

  const articleMap = new Map(favoriteArticles.map((row) => [row.id, row]));
  const spaceMap = new Map(favoriteSpaces.map((row) => [row.id, row]));

  const helpedResult = await db
    .select({
      helpedCount: sql<number>`coalesce(sum(${articles.helpfulCount} + ${articles.favoriteCount}), 0)`,
    })
    .from(articles)
    .where(eq(articles.authorId, userId));

  const solvedResult = await db
    .select({
      solvedCount: sql<number>`count(*)::int`,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.solved, true)));

  return {
    user: {
      id: String(user.id),
      name: user.name,
      school: user.school ?? "黑河学院",
    },
    stats: {
      helpedCount: (helpedResult[0]?.helpedCount ?? 0) + (solvedResult[0]?.solvedCount ?? 0),
      articleCount: articleContents.length,
      favoriteCount: favoriteRows.length,
    },
    spaces: ownedSpaces.map((row) =>
      mapSpaceRow({
        ...row,
        maintainerId: user.id,
        maintainerName: user.name,
      }),
    ),
    contents: [
      ...articleContents.map((row) => ({
        id: row.slug,
        slug: row.slug,
        spaceId: "",
        parentId: null,
        title: row.title,
        summary: summarizeContent(row.summary),
        helpfulCount: row.helpfulCount,
        changedCount: row.changedCount,
        readCount: row.readCount,
        favoriteCount: row.favoriteCount,
        confirmedAt: toIso(row.confirmedAt),
        updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
      })),
      ...postContents.map((row) => ({
        id: String(row.id),
        spaceId: String(row.kbId ?? ""),
        content: row.content,
        tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
        author: {
          id: String(user.id),
          name: user.name,
        },
        helpfulCount: row.favoriteCount,
        replyCount: row.replyCount,
        solved: row.solved,
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
        replies: [],
      })),
    ],
    favorites: favoriteRows.map((row) => {
      const target = row.targetType === "article" ? articleMap.get(row.targetId) : spaceMap.get(row.targetId);
      return {
        id: String(row.id),
        targetType: row.targetType as "article" | "space",
        targetId: target?.slug ?? String(row.targetId),
        title: target?.title ?? String(row.targetId),
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      } satisfies FavoriteRecord;
    }),
    canCreateSpace: user.trustLevel === "senior" || user.trustLevel === "admin",
  } satisfies ProfileResponse;
}

export async function createReportInDb(
  userId: number,
  input: { targetType: "article" | "post"; targetId: string; reason: string },
) {
  if (!db) return null;

  const targetId =
    input.targetType === "article"
      ? (await resolveArticleBySlug(input.targetId))?.id
      : Number(input.targetId);

  if (!targetId || !Number.isFinite(targetId)) return null;

  const [report] = await db
    .insert(reports)
    .values({
      reporterId: userId,
      targetType: input.targetType,
      targetId,
      reason: input.reason,
    })
    .returning({
      id: reports.id,
      createdAt: reports.createdAt,
    });

  return report
    ? {
        id: String(report.id),
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        createdAt: toIso(report.createdAt) ?? new Date().toISOString(),
      }
    : null;
}

export async function recordSearchLogInDb(input: {
  userId?: number | null;
  query: string;
  resultCount: number;
  usedAi: boolean;
}) {
  if (!db) return null;

  const [record] = await db
    .insert(searchLogs)
    .values({
      userId: input.userId ?? null,
      query: input.query,
      resultCount: input.resultCount,
      usedAi: input.usedAi,
    })
    .returning({
      id: searchLogs.id,
      query: searchLogs.query,
      resultCount: searchLogs.resultCount,
      usedAi: searchLogs.usedAi,
      createdAt: searchLogs.createdAt,
    });

  return record
    ? ({
        id: String(record.id),
        query: record.query,
        resultCount: record.resultCount,
        usedAi: record.usedAi,
        createdAt: toIso(record.createdAt) ?? new Date().toISOString(),
      } satisfies SearchLogRecord)
    : null;
}

export async function listExpiredArticlesFromDb(olderThanDays: number) {
  if (!db) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      authorId: articles.authorId,
      title: articles.title,
      confirmedAt: articles.confirmedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(
      sql`${articles.status} = 'published' and coalesce(${articles.confirmedAt}, ${articles.updatedAt}) < ${cutoff.toISOString()}`
    )
    .limit(100);

  return rows.map((row) => ({
    id: String(row.id),
    slug: row.slug,
    authorId: row.authorId,
    title: row.title,
    confirmedAt: toIso(row.confirmedAt),
    updatedAt: toIso(row.updatedAt),
  }));
}

export async function listSearchGapsFromDb() {
  if (!db) return null;

  const rows = await db
    .select({
      query: searchLogs.query,
      count: sql<number>`count(*)::int`,
      lastSearchedAt: sql<Date>`max(${searchLogs.createdAt})`,
    })
    .from(searchLogs)
    .where(eq(searchLogs.resultCount, 0))
    .groupBy(searchLogs.query)
    .orderBy(sql`count(*) desc`, sql`max(${searchLogs.createdAt}) desc`)
    .limit(50);

  return rows.map((row) => ({
    query: row.query,
    count: row.count,
    lastSearchedAt: toIso(row.lastSearchedAt) ?? new Date().toISOString(),
  }));
}

export async function searchContentFromDb(query: string) {
  if (!db) return null;

  const value = query.trim();
  if (!value) {
    return {
      articles: [],
      posts: [],
      spaces: [],
    } satisfies SearchResponse;
  }

  const pattern = `%${value}%`;
  const documentRows = await db
    .select({
      targetType: searchDocuments.targetType,
      targetId: searchDocuments.targetId,
      title: searchDocuments.title,
      body: searchDocuments.body,
      spaceSlug: searchDocuments.spaceSlug,
      payload: searchDocuments.payload,
      updatedAt: searchDocuments.updatedAt,
      rank: sql<number>`ts_rank(
        to_tsvector('simple', ${searchDocuments.title} || ' ' || ${searchDocuments.body}),
        plainto_tsquery('simple', ${value})
      )`,
      exactRank: sql<number>`case when lower(${searchDocuments.title}) = lower(${value}) then 2 when ${searchDocuments.title} ilike ${pattern} then 1 else 0 end`,
    })
    .from(searchDocuments)
    .where(
      and(
        eq(searchDocuments.site, "cn"),
        sql`(
          to_tsvector('simple', ${searchDocuments.title} || ' ' || ${searchDocuments.body}) @@ plainto_tsquery('simple', ${value})
          or ${searchDocuments.title} ilike ${pattern}
          or ${searchDocuments.body} ilike ${pattern}
        )`,
      ),
    )
    .orderBy(
      sql`case when lower(${searchDocuments.title}) = lower(${value}) then 2 when ${searchDocuments.title} ilike ${pattern} then 1 else 0 end desc`,
      sql`ts_rank(to_tsvector('simple', ${searchDocuments.title} || ' ' || ${searchDocuments.body}), plainto_tsquery('simple', ${value})) desc`,
      desc(searchDocuments.updatedAt),
    )
    .limit(30);

  if (documentRows.length === 0) {
    await refreshSearchDocumentsInDb();
    return searchContentFromDocuments(value, pattern);
  }

  return toSearchResponse(documentRows);
}

async function searchContentFromDocuments(value: string, pattern: string) {
  if (!db) return null;

  const rows = await db
    .select({
      targetType: searchDocuments.targetType,
      targetId: searchDocuments.targetId,
      title: searchDocuments.title,
      body: searchDocuments.body,
      spaceSlug: searchDocuments.spaceSlug,
      payload: searchDocuments.payload,
      updatedAt: searchDocuments.updatedAt,
      rank: sql<number>`ts_rank(
        to_tsvector('simple', ${searchDocuments.title} || ' ' || ${searchDocuments.body}),
        plainto_tsquery('simple', ${value})
      )`,
      exactRank: sql<number>`case when lower(${searchDocuments.title}) = lower(${value}) then 2 when ${searchDocuments.title} ilike ${pattern} then 1 else 0 end`,
    })
    .from(searchDocuments)
    .where(
      and(
        eq(searchDocuments.site, "cn"),
        sql`(
          to_tsvector('simple', ${searchDocuments.title} || ' ' || ${searchDocuments.body}) @@ plainto_tsquery('simple', ${value})
          or ${searchDocuments.title} ilike ${pattern}
          or ${searchDocuments.body} ilike ${pattern}
        )`,
      ),
    )
    .orderBy(
      sql`case when lower(${searchDocuments.title}) = lower(${value}) then 2 when ${searchDocuments.title} ilike ${pattern} then 1 else 0 end desc`,
      sql`ts_rank(to_tsvector('simple', ${searchDocuments.title} || ' ' || ${searchDocuments.body}), plainto_tsquery('simple', ${value})) desc`,
      desc(searchDocuments.updatedAt),
    )
    .limit(30);

  return toSearchResponse(rows);
}

interface SearchDocumentResultRow {
  targetType: string;
  targetId: string;
  title: string;
  body: string;
  spaceSlug: string | null;
  payload: Record<string, unknown>;
  updatedAt: Date;
  rank?: number;
  exactRank?: number;
}

function toSearchResponse(rows: SearchDocumentResultRow[]) {
  const articleRows = rows.filter((row) => row.targetType === "article").slice(0, 10);
  const postRows = rows.filter((row) => row.targetType === "post").slice(0, 10);
  const spaceRows = rows.filter((row) => row.targetType === "space").slice(0, 10);

  return {
    articles: articleRows.map((row) => ({
      id: stringFromPayload(row.payload, "slug") ?? row.targetId,
      slug: stringFromPayload(row.payload, "slug") ?? row.targetId,
      spaceId: row.spaceSlug ?? "",
      parentId: null,
      title: row.title,
      summary: summarizeContent(row.body),
      helpfulCount: numberFromPayload(row.payload, "helpfulCount"),
      changedCount: numberFromPayload(row.payload, "changedCount"),
      readCount: numberFromPayload(row.payload, "readCount"),
      favoriteCount: numberFromPayload(row.payload, "favoriteCount"),
      confirmedAt: stringFromPayload(row.payload, "confirmedAt"),
      updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    }) satisfies ArticleSummary),
    posts: postRows.map((row) => ({
      id: row.targetId,
      spaceId: row.spaceSlug ?? "",
      content: row.body,
      tags: arrayFromPayload(row.payload, "tags"),
      author: {
        id: stringFromPayload(row.payload, "authorId") ?? "0",
        name: stringFromPayload(row.payload, "authorName") ?? "同学",
      },
      helpfulCount: numberFromPayload(row.payload, "helpfulCount"),
      replyCount: numberFromPayload(row.payload, "replyCount"),
      solved: Boolean(row.payload.solved),
      createdAt: toIso(row.updatedAt) ?? new Date().toISOString(),
      replies: [],
    }) satisfies PostRecord),
    spaces: spaceRows.map((row) =>
      mapSpaceRow({
        id: row.targetId,
        slug: row.targetId,
        title: row.title,
        description: row.body,
        category: stringFromPayload(row.payload, "category"),
        articleCount: numberFromPayload(row.payload, "articleCount"),
        favoriteCount: numberFromPayload(row.payload, "favoriteCount"),
        recentActiveAt: row.updatedAt,
        maintainerId: numberFromPayload(row.payload, "maintainerId"),
        maintainerName: stringFromPayload(row.payload, "maintainerName"),
        helpfulCount: numberFromPayload(row.payload, "helpfulCount"),
      }),
    ),
  } satisfies SearchResponse;
}

function numberFromPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringFromPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function arrayFromPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return Array.isArray(value) ? value.map(String) : [];
}

export async function refreshSearchDocumentsInDb() {
  if (!db) return null;

  const [spaceRows, articleRows, postRows] = await Promise.all([
    db
      .select({
        slug: knowledgeBases.slug,
        title: knowledgeBases.title,
        description: knowledgeBases.description,
        category: knowledgeBases.category,
        articleCount: knowledgeBases.articleCount,
        favoriteCount: knowledgeBases.favoriteCount,
        updatedAt: knowledgeBases.updatedAt,
        maintainerId: users.id,
        maintainerName: users.nickname,
      })
      .from(knowledgeBases)
      .leftJoin(users, eq(knowledgeBases.ownerId, users.id)),
    db
      .select({
        dbId: articles.id,
        slug: articles.slug,
        title: articles.title,
        content: articles.content,
        helpfulCount: articles.helpfulCount,
        changedCount: articles.changedCount,
        readCount: articles.readCount,
        favoriteCount: articles.favoriteCount,
        confirmedAt: articles.confirmedAt,
        updatedAt: articles.updatedAt,
        spaceSlug: knowledgeBases.slug,
      })
      .from(articles)
      .innerJoin(knowledgeBases, eq(articles.kbId, knowledgeBases.id)),
    db
      .select({
        id: posts.id,
        content: posts.content,
        tags: posts.tags,
        favoriteCount: posts.favoriteCount,
        replyCount: posts.replyCount,
        solved: posts.solved,
        updatedAt: posts.updatedAt,
        spaceSlug: knowledgeBases.slug,
        authorId: users.id,
        authorName: users.nickname,
      })
      .from(posts)
      .leftJoin(knowledgeBases, eq(posts.kbId, knowledgeBases.id))
      .innerJoin(users, eq(posts.authorId, users.id)),
  ]);

  await db.delete(searchDocuments).where(eq(searchDocuments.site, "cn"));

  const values = [
    ...spaceRows.map((row) => ({
      site: "cn",
      targetType: "space",
      targetId: row.slug,
      title: row.title,
      body: row.description ?? "",
      spaceSlug: row.slug,
      payload: {
        category: row.category,
        articleCount: row.articleCount,
        favoriteCount: row.favoriteCount,
        helpfulCount: 0,
        maintainerId: row.maintainerId,
        maintainerName: row.maintainerName,
      },
      updatedAt: row.updatedAt,
    })),
    ...articleRows.map((row) => ({
      site: "cn",
      targetType: "article",
      targetId: String(row.dbId),
      title: row.title,
      body: row.content,
      spaceSlug: row.spaceSlug,
      payload: {
        slug: row.slug,
        helpfulCount: row.helpfulCount,
        changedCount: row.changedCount,
        readCount: row.readCount,
        favoriteCount: row.favoriteCount,
        confirmedAt: toIso(row.confirmedAt),
      },
      updatedAt: row.updatedAt,
    })),
    ...postRows.map((row) => ({
      site: "cn",
      targetType: "post",
      targetId: String(row.id),
      title: summarizeContent(row.content).slice(0, 80) || `帖子 ${row.id}`,
      body: row.content,
      spaceSlug: row.spaceSlug ?? null,
      payload: {
        tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
        helpfulCount: row.favoriteCount,
        replyCount: row.replyCount,
        solved: row.solved,
        authorId: String(row.authorId),
        authorName: row.authorName,
      },
      updatedAt: row.updatedAt,
    })),
  ];

  if (values.length) {
    await db.insert(searchDocuments).values(values);
  }

  return values.length;
}

export async function listFeedFromDb(page: number, pageSize: number) {
  if (!db) return null;

  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.min(Math.max(1, pageSize), 20);

  const articleRows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      kbSlug: knowledgeBases.slug,
      title: articles.title,
      content: articles.content,
      actorName: users.nickname,
      helpfulCount: articles.helpfulCount,
      createdAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(knowledgeBases, eq(articles.kbId, knowledgeBases.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.updatedAt))
    .limit(30);

  const postRows = await db
    .select({
      id: posts.id,
      kbSlug: knowledgeBases.slug,
      content: posts.content,
      actorName: users.nickname,
      helpfulCount: posts.favoriteCount,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .leftJoin(knowledgeBases, eq(posts.kbId, knowledgeBases.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(30);

  const changedRows = await db
    .select({
      id: feedbacks.id,
      articleSlug: articles.slug,
      title: articles.title,
      note: feedbacks.changedNote,
      actorName: users.nickname,
      createdAt: feedbacks.createdAt,
    })
    .from(feedbacks)
    .innerJoin(articles, eq(feedbacks.targetId, articles.id))
    .innerJoin(users, eq(feedbacks.userId, users.id))
    .where(and(eq(feedbacks.targetType, "article"), eq(feedbacks.type, "changed")))
    .orderBy(desc(feedbacks.createdAt))
    .limit(30);

  const allItems: FrontlifeFeedItem[] = [
    ...articleRows.map((row) => ({
      id: `article-${row.id}`,
      type: "article" as const,
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      articleId: row.slug,
      spaceId: row.kbSlug,
      title: row.title,
      summary: summarizeContent(row.content),
      actorName: row.actorName,
      helpfulCount: row.helpfulCount,
    })),
    ...postRows.map((row) => ({
      id: `post-${row.id}`,
      type: "post" as const,
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      postId: String(row.id),
      spaceId: row.kbSlug ?? "",
      content: row.content,
      actorName: row.actorName,
      helpfulCount: row.helpfulCount,
    })),
    ...changedRows.map((row) => ({
      id: `changed-${row.id}`,
      type: "changed" as const,
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      articleId: row.articleSlug,
      title: row.title,
      note: row.note ?? "有人反馈可能有变化",
      actorName: row.actorName,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const start = (normalizedPage - 1) * normalizedPageSize;
  const end = start + normalizedPageSize;

  return {
    items: allItems.slice(start, end),
    hasMore: end < allItems.length,
  };
}

async function resolveSpaceBySlug(spaceSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: knowledgeBases.id,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      category: knowledgeBases.category,
    })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.slug, spaceSlug));

  return rows[0] ?? null;
}

async function resolveArticleBySlug(articleSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      id: articles.id,
      kbId: articles.kbId,
      slug: articles.slug,
      authorId: articles.authorId,
    })
    .from(articles)
    .where(eq(articles.slug, articleSlug));

  return rows[0] ?? null;
}

async function resolveFavoriteArticle(articleSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: articles.id,
      slug: articles.slug,
      title: articles.title,
      ownerId: articles.authorId,
    })
    .from(articles)
    .where(eq(articles.slug, articleSlug));

  return rows[0] ?? null;
}

async function resolveFavoriteSpace(spaceSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: knowledgeBases.id,
      slug: knowledgeBases.slug,
      title: knowledgeBases.title,
      ownerId: knowledgeBases.ownerId,
    })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.slug, spaceSlug));

  return rows[0] ?? null;
}

async function resolveUserNotificationSite(userId: number) {
  if (!db) return null;

  const rows = await db
    .select({ site: users.site })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const site = rows[0]?.site;
  return site === "com" ? "com" : site === "cn" ? "cn" : null;
}

async function createNotificationInDb(
  userId: number,
  type: NotificationRecord["type"],
  title: string,
  content: string,
  relatedType?: string,
  relatedId?: number,
) {
  if (!db) return;
  const site = await resolveUserNotificationSite(userId);
  if (!site) return;

  await db.insert(notifications).values({
    userId,
    site,
    type,
    title,
    content,
    relatedType,
    relatedId,
  });
}

async function recordTrustEvent(
  userId: number,
  action: "post_created" | "article_helpful" | "content_favorited" | "help_solved",
  points: number,
  relatedType: string,
  relatedId: number,
) {
  if (!db) return;

  await db.insert(trustEvents).values({
    userId,
    action,
    points,
    relatedType,
    relatedId,
  });

  await updateTrustLevelFromEvents(userId);
}

async function updateTrustLevelFromEvents(userId: number) {
  if (!db) return;

  const rows = await db
    .select({
      score: sql<number>`coalesce(sum(${trustEvents.points}), 0)`,
    })
    .from(trustEvents)
    .where(eq(trustEvents.userId, userId));

  const score = rows[0]?.score ?? 0;

  const userRows = await db
    .select({
      trustLevel: users.trustLevel,
    })
    .from(users)
    .where(eq(users.id, userId));

  const user = userRows[0];
  if (!user) return;

  const nextTrustLevel = getHigherTrustLevel(user.trustLevel, getTrustLevelFromScore(score));

  if (nextTrustLevel !== user.trustLevel) {
    await db
      .update(users)
      .set({
        trustLevel: nextTrustLevel,
      })
      .where(eq(users.id, userId));

    await createNotificationInDb(userId, "trust", "权限已升级", `你当前的贡献已提升到 ${nextTrustLevel}。`, "user", userId);

    // 升级到 author 时发送认证邀请通知
    if (nextTrustLevel === "author") {
      await createAuthInviteNotificationInDb(userId);
    }
  }
}

async function getPostById(postId: number, spaceSlug: string) {
  if (!db) return null;

  const rows = await db
    .select({
      dbId: posts.id,
      content: posts.content,
      tags: posts.tags,
      helpfulCount: posts.favoriteCount,
      replyCount: posts.replyCount,
      solved: posts.solved,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.nickname,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId));

  const row = rows[0];
  if (!row) return null;

  return {
    id: String(row.dbId),
    spaceId: spaceSlug,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    author: {
      id: String(row.authorId),
      name: row.authorName,
    },
    helpfulCount: row.helpfulCount,
    replyCount: row.replyCount,
    solved: row.solved,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    replies: [],
  } satisfies PostRecord;
}

async function insertActivity(
  targetType: "article" | "post" | "knowledge_base",
  targetId: number,
  action: "helpful" | "changed" | "reply" | "update",
  userId: number,
) {
  if (!db) return;

  await db.insert(activities).values({
    targetType,
    targetId,
    userId,
    action,
  });
}

function mapSpaceRow(row: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  articleCount: number;
  favoriteCount: number;
  recentActiveAt: Date | string | null;
  maintainerId: number | null;
  maintainerName: string | null;
  helpfulCount: number;
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    iconName: categoryToIcon(row.category),
    category: row.category ?? "",
    articleCount: row.articleCount,
    helpfulCount: row.helpfulCount,
    favoriteCount: row.favoriteCount,
    recentActiveAt: toIso(row.recentActiveAt) ?? new Date().toISOString(),
    maintainer: {
      id: row.maintainerId ? String(row.maintainerId) : "0",
      name: row.maintainerName ?? "盘根编辑",
    },
  } satisfies SpaceSummary;
}

function categoryToIcon(category: string | null) {
  return getCategoryBySlug(category ?? "")?.iconName ?? "BookOpen";
}

function summarizeContent(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function slugify(text: string) {
  const ascii = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return ascii || `article-${Date.now()}`;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}
