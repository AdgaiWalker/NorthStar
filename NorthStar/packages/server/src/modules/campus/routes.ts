import { Hono } from "hono";
import type { Context } from "hono";
import {
  createArticleInDb,
  createContentExpiryNotificationInDb,
  createFavoriteInDb,
  createPostInDb,
  createReplyInDb,
  getArticleDetailFromDb,
  getProfileFromDb,
  getSpaceDetailFromDb,
  listExpiredArticlesFromDb,
  listFeedFromDb,
  listSearchGapsFromDb,
  listPostsBySpaceFromDb,
  listSpacesFromDb,
  markArticleChangedInDb,
  markArticleHelpfulInDb,
  markPostSolvedInDb,
  recordSearchLogInDb,
  resolveArticleChangedInDb,
  searchContentFromDb,
  updateArticleInDb,
  updatePostInDb,
} from "../../data/postgres";
import { db } from "../../db/client";
import { getPermissionStateForUser } from "../../lib/permissions";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import { submitModerationTask } from "../moderation/service";
import { getCampusModuleStatus, scanCampusSpaceClaims, submitCampusSpace } from "./service";
import type { CreateCampusSpaceRequest, SpaceClaimScanRequest } from "./types";

export const campusRoute = new Hono();

campusRoute.get("/api/campus/health", (c) => ok(c, getCampusModuleStatus()));

campusRoute.get("/api/campus/spaces", async (c) => {
  const spaces = await listSpacesFromDb();
  if (!spaces) return fail(c, 500, "SPACES_QUERY_FAILED", "空间列表查询失败");
  return c.json({ spaces });
});

campusRoute.get("/api/campus/spaces/:id", async (c) => {
  const detail = await getSpaceDetailFromDb(c.req.param("id"));
  if (!detail) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json(detail);
});

campusRoute.post("/api/campus/spaces", authMiddleware, async (c) => {
  const result = await submitCampusSpace(
    requireSiteContext(c),
    requireAuthUser(c),
    await readJson<CreateCampusSpaceRequest>(c),
  );
  return sendResult(c, result, 201);
});

campusRoute.get("/api/campus/spaces/:id/posts", async (c) => {
  const posts = await listPostsBySpaceFromDb(c.req.param("id"));
  if (!posts) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json({ posts });
});

campusRoute.get("/api/campus/articles/:id", async (c) => {
  const detail = await getArticleDetailFromDb(c.req.param("id"));
  if (!detail) return fail(c, 404, "ARTICLE_NOT_FOUND", "文章不存在");
  return c.json(detail);
});

campusRoute.post("/api/campus/articles", authMiddleware, async (c) => {
  const body = await readJson<{ spaceId?: string; title?: string; content?: string }>(c);

  if (!body.spaceId?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请选择空间");
  if (!body.title?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写标题");
  if (!body.content?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写正文");

  const actor = requireAuthUser(c);
  const userId = Number(actor.sub);
  const permissionState = await getPermissionStateForUser({ isAuthenticated: true, userId });

  if (!db) return fail(c, 500, "DATABASE_UNAVAILABLE", "数据库不可用");
  if (!permissionState.permissions.canWrite) return fail(c, 403, "ARTICLE_FORBIDDEN", "当前账号还不能写长文");

  const article = await createArticleInDb(userId, {
    spaceId: body.spaceId.trim(),
    title: body.title.trim(),
    content: body.content.trim(),
  });

  if (!article) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json({ article }, 201);
});

campusRoute.post("/api/campus/articles/:id/helpful", authMiddleware, async (c) => {
  const result = await markArticleHelpfulInDb(c.req.param("id"), Number(requireAuthUser(c).sub));
  if (!result) return fail(c, 404, "ARTICLE_NOT_FOUND", "文章不存在");
  return c.json(result);
});

campusRoute.post("/api/campus/articles/:id/changed", authMiddleware, async (c) => {
  const body = await readJson<{ note?: string }>(c);
  const note = body.note?.trim();
  if (!note) return fail(c, 400, "VALIDATION_ERROR", "请填写变化说明");

  const actor = requireAuthUser(c);
  const id = c.req.param("id");
  const result = await markArticleChangedInDb(id, note, Number(actor.sub));
  if (!result) return fail(c, 404, "ARTICLE_NOT_FOUND", "文章不存在");

  await submitModerationTask(
    {
      site: requireSiteContext(c) === "com" ? "com" : "cn",
      type: "changed_feedback",
      targetType: "article",
      targetId: id,
      title: "内容变化反馈",
      reason: note,
      payload: {
        articleId: id,
        changedCount: result.changedCount,
      },
    },
    actor,
  );

  return c.json(result);
});

campusRoute.post("/api/campus/articles/:id/resolve-changed", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  const result = await resolveArticleChangedInDb(c.req.param("id"), Number(actor.sub));
  if (!result) return fail(c, 404, "RESOLVE_CHANGED_FAILED", "无法解除变化标记，只有文章作者可以操作");
  return c.json(result);
});

campusRoute.patch("/api/campus/articles/:id", authMiddleware, async (c) => {
  const body = await readJson<{ title?: string; content?: string; summary?: string }>(c);

  if (!body.title?.trim() && !body.content?.trim()) {
    return fail(c, 400, "VALIDATION_ERROR", "请提供标题或内容");
  }

  const actor = requireAuthUser(c);
  const updates: { title?: string; content?: string; summary?: string } = {};
  if (body.title?.trim()) updates.title = body.title.trim();
  if (body.content?.trim()) updates.content = body.content.trim();
  if (body.summary?.trim()) updates.summary = body.summary.trim();

  const article = await updateArticleInDb(c.req.param("id"), updates, Number(actor.sub));
  if (!article) return fail(c, 403, "ARTICLE_UPDATE_FORBIDDEN", "无权编辑此文章");
  return c.json({ article });
});

campusRoute.post("/api/campus/posts", authMiddleware, async (c) => {
  const body = await readJson<{ spaceId?: string; content?: string; tags?: string[] }>(c);

  if (!body.content?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写帖子内容");

  const actor = requireAuthUser(c);
  const permissionState = await getPermissionStateForUser({
    isAuthenticated: true,
    userId: Number(actor.sub),
  });

  if (!permissionState.permissions.canPost) return fail(c, 403, "POST_FORBIDDEN", "当前账号还不能发帖");

  const post = await createPostInDb({
    spaceId: body.spaceId,
    content: body.content.trim(),
    tags: body.tags,
    userId: Number(actor.sub),
  });

  if (!post) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json({ post }, 201);
});

campusRoute.post("/api/campus/posts/:id/replies", authMiddleware, async (c) => {
  const body = await readJson<{ content?: string }>(c);
  if (!body.content?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写回复内容");

  const actor = requireAuthUser(c);
  const reply = await createReplyInDb(c.req.param("id"), body.content.trim(), Number(actor.sub), actor.name);

  if (!reply) return fail(c, 404, "POST_NOT_FOUND", "帖子不存在");
  return c.json({ reply }, 201);
});

campusRoute.post("/api/campus/posts/:id/solve", authMiddleware, async (c) => {
  const post = await markPostSolvedInDb(c.req.param("id"), Number(requireAuthUser(c).sub));
  if (!post) return fail(c, 404, "POST_NOT_FOUND", "帖子不存在");
  return c.json({ post });
});

campusRoute.patch("/api/campus/posts/:id", authMiddleware, async (c) => {
  const body = await readJson<{ title?: string; content?: string }>(c);

  if (!body.title?.trim() && !body.content?.trim()) {
    return fail(c, 400, "VALIDATION_ERROR", "请提供标题或内容");
  }

  const actor = requireAuthUser(c);
  const updates: { title?: string; content?: string } = {};
  if (body.title?.trim()) updates.title = body.title.trim();
  if (body.content?.trim()) updates.content = body.content.trim();

  const post = await updatePostInDb(c.req.param("id"), updates, Number(actor.sub));
  if (!post) return fail(c, 403, "POST_UPDATE_FORBIDDEN", "无权编辑此帖子");
  return c.json({ post });
});

campusRoute.get("/api/campus/feed", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const pageSize = Number(c.req.query("pageSize") ?? 6);
  const feed = await listFeedFromDb(page, pageSize);
  if (!feed) return fail(c, 500, "FEED_QUERY_FAILED", "动态流查询失败");
  return c.json(feed);
});

campusRoute.get("/api/campus/search", async (c) => {
  const query = c.req.query("q")?.trim();
  if (!query) return fail(c, 400, "VALIDATION_ERROR", "请输入搜索词");

  const result = await searchContentFromDb(query);
  if (!result) return fail(c, 500, "SEARCH_FAILED", "搜索失败");
  return c.json(result);
});

campusRoute.post("/api/campus/search/logs", async (c) => {
  const body = await readJson<{ query?: string; resultCount?: number; usedAi?: boolean }>(c);
  if (!body.query?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请输入搜索词");

  const authUser = resolveAuthUser(c);
  const log = await recordSearchLogInDb({
    userId: authUser ? Number(authUser.sub) : null,
    query: body.query.trim(),
    resultCount: Number(body.resultCount ?? 0),
    usedAi: Boolean(body.usedAi),
  });

  if (!log) return fail(c, 500, "SEARCH_LOG_FAILED", "搜索日志写入失败");
  return c.json({ log }, 201);
});

campusRoute.get("/api/campus/search/gaps", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (actor.role !== "reviewer" && actor.role !== "operator" && actor.role !== "admin") {
    return fail(c, 403, "SEARCH_GAPS_FORBIDDEN", "没有查看搜索缺口的权限");
  }

  const gaps = await listSearchGapsFromDb();
  if (!gaps) return fail(c, 500, "SEARCH_GAPS_FAILED", "搜索缺口报表生成失败");
  return ok(c, { items: gaps });
});

campusRoute.get("/api/campus/me/profile", authMiddleware, async (c) => {
  const profile = await getProfileFromDb(Number(requireAuthUser(c).sub));
  if (!profile) return fail(c, 404, "PROFILE_NOT_FOUND", "用户资料不存在");
  return c.json(profile);
});

campusRoute.post("/api/campus/favorites", authMiddleware, async (c) => {
  const body = await readJson<{ targetType?: "article" | "space"; targetId?: string }>(c);

  if (body.targetType !== "article" && body.targetType !== "space") {
    return fail(c, 400, "VALIDATION_ERROR", "收藏类型不正确");
  }
  if (!body.targetId?.trim()) return fail(c, 400, "VALIDATION_ERROR", "收藏对象不能为空");

  const favorite = await createFavoriteInDb(Number(requireAuthUser(c).sub), {
    targetType: body.targetType,
    targetId: body.targetId.trim(),
  });

  if (!favorite) return fail(c, 404, "FAVORITE_TARGET_NOT_FOUND", "收藏对象不存在");
  return c.json({ favorite }, 201);
});

campusRoute.post("/api/campus/space-claims/scan", authMiddleware, async (c) => {
  const result = await scanCampusSpaceClaims(
    requireSiteContext(c),
    requireAuthUser(c),
    await readJson<SpaceClaimScanRequest>(c),
  );
  return sendResult(c, result, 201);
});

campusRoute.post("/api/campus/content-expiry/scan", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (actor.role !== "reviewer" && actor.role !== "operator" && actor.role !== "admin") {
    return fail(c, 403, "EXPIRY_SCAN_FORBIDDEN", "没有内容过期扫描权限");
  }

  const body = await readJson<{ olderThanDays?: number }>(c);
  const olderThanDays = body.olderThanDays && Number.isInteger(body.olderThanDays) ? body.olderThanDays : 180;

  const expired = await listExpiredArticlesFromDb(olderThanDays);
  if (!expired) return fail(c, 500, "EXPIRY_SCAN_FAILED", "内容过期扫描失败");

  let notifiedCount = 0;
  for (const article of expired) {
    await createContentExpiryNotificationInDb(article.authorId, article.slug);
    notifiedCount++;
  }

  return ok(c, { scannedCount: expired.length, notifiedCount });
});

async function readJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    return {} as T;
  }
}

function sendResult<T>(
  c: Context,
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 401 | 403 | 409 | 503 } },
  successStatus: 200 | 201 = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}
