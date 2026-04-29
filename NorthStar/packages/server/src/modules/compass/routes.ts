import { Hono } from "hono";
import type { Context } from "hono";
import type { CompassFavoriteRecord, CreateSolutionRequest, SolutionFeedbackRequest } from "@ns/shared";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import {
  compassContentService,
  addCompassFavorite,
  exportCompassSolution,
  getCompassModuleStatus,
  readCompassFavorites,
  readCompassSolution,
  readCompassSolutions,
  removeCompassFavorite,
  removeCompassSolution,
  submitCompassSolution,
  submitCompassSolutionFeedback,
  createContent,
  updateContent,
  submitContentForReview,
  adminListContent,
  adminGetContent,
  adminUpdateContentStatus,
} from "./service";
import type { CreateContentInput, UpdateContentInput } from "./service";

export const compassRoute = new Hono();

compassRoute.get("/api/compass/health", (c) => c.json({ ok: true, data: getCompassModuleStatus() }));

compassRoute.get("/api/compass/tools", async (c) => ok(c, { items: await compassContentService.listTools() }));

compassRoute.get("/api/compass/tools/:id", async (c) => {
  const item = await compassContentService.getTool(c.req.param("id"));
  if (!item) return c.json({ ok: false, error: { code: "TOOL_NOT_FOUND", message: "工具不存在" } }, 404);
  return ok(c, item);
});

compassRoute.get("/api/compass/topics", async (c) => ok(c, { items: await compassContentService.listTopics() }));

compassRoute.get("/api/compass/topics/:id", async (c) => {
  const item = await compassContentService.getTopic(c.req.param("id"));
  if (!item) return c.json({ ok: false, error: { code: "TOPIC_NOT_FOUND", message: "专题不存在" } }, 404);
  return ok(c, item);
});

compassRoute.get("/api/compass/articles", async (c) => ok(c, { items: await compassContentService.listArticles() }));

compassRoute.get("/api/compass/articles/:id", async (c) => {
  const item = await compassContentService.getArticle(c.req.param("id"));
  if (!item) return c.json({ ok: false, error: { code: "ARTICLE_NOT_FOUND", message: "文章不存在" } }, 404);
  return ok(c, item);
});

compassRoute.get("/api/compass/news", async (c) => ok(c, { items: await compassContentService.listNews() }));

compassRoute.get("/api/compass/search", async (c) => {
  const query = c.req.query("q")?.trim();
  if (!query) return fail(c, 400, "VALIDATION_ERROR", "请输入搜索词");
  const result = await compassContentService.search(query);
  return ok(c, result);
});

compassRoute.get("/api/compass/favorites", authMiddleware, async (c) => {
  const result = await readCompassFavorites(requireAuthUser(c));
  return sendResult(c, result);
});

compassRoute.post("/api/compass/favorites", authMiddleware, async (c) => {
  const result = await addCompassFavorite(
    requireAuthUser(c),
    await readJson<Pick<CompassFavoriteRecord, "targetType" | "targetId">>(c),
  );
  return sendResult(c, result, 201);
});

compassRoute.delete("/api/compass/favorites", authMiddleware, async (c) => {
  const result = await removeCompassFavorite(
    requireAuthUser(c),
    await readJson<Pick<CompassFavoriteRecord, "targetType" | "targetId">>(c),
  );
  return sendResult(c, result);
});

compassRoute.get("/api/compass/solutions", authMiddleware, async (c) => {
  const result = await readCompassSolutions(requireAuthUser(c));
  return sendResult(c, result);
});

compassRoute.post("/api/compass/solutions", authMiddleware, async (c) => {
  const result = await submitCompassSolution(requireAuthUser(c), await readJson<CreateSolutionRequest>(c));
  return sendResult(c, result, 201);
});

compassRoute.get("/api/compass/solutions/:id/export", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "方案 ID 不正确");

  const format = c.req.query("format");
  if (format !== "md" && format !== "txt" && format !== "csv") {
    return fail(c, 400, "VALIDATION_ERROR", "导出格式不正确");
  }

  const result = await exportCompassSolution(requireAuthUser(c), id, format);
  if (!result.ok || result.error || !result.data) {
    return fail(
      c,
      result.error?.status ?? 400,
      result.error?.code ?? "REQUEST_FAILED",
      result.error?.message ?? "请求失败",
    );
  }

  return new Response(result.data.content, {
    headers: {
      "Content-Type": result.data.contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(result.data.filename)}"`,
    },
  });
});

compassRoute.get("/api/compass/solutions/:id", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "方案 ID 不正确");

  const result = await readCompassSolution(requireAuthUser(c), id);
  return sendResult(c, result);
});

compassRoute.delete("/api/compass/solutions/:id", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "方案 ID 不正确");

  const result = await removeCompassSolution(requireAuthUser(c), id);
  return sendResult(c, result);
});

compassRoute.post("/api/compass/solutions/:id/feedback", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "方案 ID 不正确");

  const result = await submitCompassSolutionFeedback(
    requireAuthUser(c),
    id,
    await readJson<SolutionFeedbackRequest>(c),
  );
  return sendResult(c, result, 201);
});

// ─── Content Write Routes ───

compassRoute.post("/api/compass/content", authMiddleware, async (c) => {
  const result = await createContent(await readJson<CreateContentInput>(c), requireAuthUser(c));
  return sendResult(c, result, 201);
});

compassRoute.patch("/api/compass/content/:id", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "内容 ID 不正确");

  const result = await updateContent(id, await readJson<UpdateContentInput>(c), requireAuthUser(c));
  return sendResult(c, result);
});

compassRoute.post("/api/compass/content/:id/submit", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "内容 ID 不正确");

  const result = await submitContentForReview(id, requireAuthUser(c));
  return sendResult(c, result);
});

// ─── Admin Content Routes ───

compassRoute.get("/api/compass/admin/content", authMiddleware, async (c) => {
  if (!isAdmin(requireAuthUser(c))) return fail(c, 403, "FORBIDDEN", "需要管理员权限");

  const site = c.req.query("site") ?? null;
  const contentType = c.req.query("contentType") ?? undefined;
  const status = c.req.query("status") ?? undefined;

  const result = await adminListContent(site, contentType, status);
  return sendResult(c, result);
});

compassRoute.get("/api/compass/admin/content/:id", authMiddleware, async (c) => {
  if (!isAdmin(requireAuthUser(c))) return fail(c, 403, "FORBIDDEN", "需要管理员权限");

  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "内容 ID 不正确");

  const result = await adminGetContent(id);
  return sendResult(c, result);
});

compassRoute.patch("/api/compass/admin/content/:id/status", authMiddleware, async (c) => {
  if (!isAdmin(requireAuthUser(c))) return fail(c, 403, "FORBIDDEN", "需要管理员权限");

  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "内容 ID 不正确");

  const body = await readJson<{ status: string }>(c);
  if (!body.status?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写目标状态");

  const result = await adminUpdateContentStatus(id, body.status, requireAuthUser(c));
  return sendResult(c, result);
});

async function readJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    return {} as T;
  }
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendResult<T>(
  c: Context,
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 401 | 403 | 404 | 503 } },
  successStatus: 200 | 201 = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}

function isAdmin(actor: { role?: string }) {
  return actor.role === "operator" || actor.role === "admin";
}
