import {
  createCompassSolution,
  createCompassFavorite,
  deleteCompassSolution,
  deleteCompassFavorite,
  getCompassArticle,
  getCompassSolution,
  getCompassTool,
  getCompassTopic,
  listCompassFavorites,
  listCompassArticles,
  listCompassNews,
  listCompassSolutions,
  listCompassTools,
  listCompassTopics,
  readCompassModuleStatus,
  recordCompassSolutionExport,
  recordCompassSolutionFeedback,
  createContentRecord,
  updateContentRecord,
  createContentVersion,
  getLatestVersionNumber,
  listContentVersions,
  listAllContent,
  getContentRecordById,
  createModerationTask,
  searchCompassContent,
} from "./repository";
import type { AuthTokenPayload } from "../../lib/auth";
import type {
  CompassFavoriteRecord,
  CreateSolutionRequest,
  ExportFormat,
  SolutionFeedbackRequest,
  SolutionRecord,
} from "@ns/shared";

export function getCompassModuleStatus() {
  return readCompassModuleStatus();
}

export const compassContentService = {
  listTools: listCompassTools,
  getTool: getCompassTool,
  listTopics: listCompassTopics,
  getTopic: getCompassTopic,
  listArticles: listCompassArticles,
  getArticle: getCompassArticle,
  listNews: listCompassNews,
  search: searchCompassContent,
};

export async function submitCompassSolution(actor: AuthTokenPayload, input: CreateSolutionRequest) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const validation = validateSolutionInput(input);
  if (validation) return resultError("VALIDATION_ERROR", validation, 400);

  const solution = await createCompassSolution(actorId, {
    title: input.title.trim(),
    targetGoal: input.targetGoal.trim(),
    toolIds: input.toolIds.map((item) => item.trim()).filter(Boolean),
    content: input.content.trim(),
  });
  if (!solution) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，方案保存失败", 503);

  return resultOk(solution);
}

export async function readCompassSolutions(actor: AuthTokenPayload) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  return resultOk({ items: await listCompassSolutions(actorId) });
}

export async function readCompassFavorites(actor: AuthTokenPayload) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  return resultOk({ items: await listCompassFavorites(actorId) });
}

export async function addCompassFavorite(
  actor: AuthTokenPayload,
  input: Pick<CompassFavoriteRecord, "targetType" | "targetId">,
) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const validation = validateFavoriteInput(input);
  if (validation) return resultError("VALIDATION_ERROR", validation, 400);

  const favorite = await createCompassFavorite(actorId, input.targetType, input.targetId.trim());
  if (!favorite) return resultError("DATABASE_UNAVAILABLE", "收藏服务暂不可用", 503);
  return resultOk(favorite);
}

export async function removeCompassFavorite(
  actor: AuthTokenPayload,
  input: Pick<CompassFavoriteRecord, "targetType" | "targetId">,
) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const validation = validateFavoriteInput(input);
  if (validation) return resultError("VALIDATION_ERROR", validation, 400);

  const deleted = await deleteCompassFavorite(actorId, input.targetType, input.targetId.trim());
  if (deleted === null) return resultError("DATABASE_UNAVAILABLE", "收藏服务暂不可用", 503);
  return resultOk({ deleted: true });
}

export async function readCompassSolution(actor: AuthTokenPayload, id: number) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const solution = await getCompassSolution(actorId, id);
  if (!solution) return resultError("SOLUTION_NOT_FOUND", "方案不存在或无权访问", 404);
  return resultOk(solution);
}

export async function removeCompassSolution(actor: AuthTokenPayload, id: number) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const deleted = await deleteCompassSolution(actorId, id);
  if (deleted === null) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，方案删除失败", 503);
  if (!deleted) return resultError("SOLUTION_NOT_FOUND", "方案不存在或无权访问", 404);
  return resultOk({ deleted: true });
}

export async function exportCompassSolution(actor: AuthTokenPayload, id: number, format: ExportFormat) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const solution = await recordCompassSolutionExport(actorId, id, format);
  if (!solution) return resultError("SOLUTION_NOT_FOUND", "方案不存在或无权访问", 404);

  return resultOk({
    filename: `${sanitizeFilename(solution.title)}.${format}`,
    content: formatSolution(solution, format),
    contentType: format === "csv" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
  });
}

export async function submitCompassSolutionFeedback(
  actor: AuthTokenPayload,
  id: number,
  input: SolutionFeedbackRequest,
) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);
  if (typeof input.helpful !== "boolean") return resultError("VALIDATION_ERROR", "请选择反馈结果", 400);

  const feedback = await recordCompassSolutionFeedback(actorId, id, input);
  if (!feedback) return resultError("SOLUTION_NOT_FOUND", "方案不存在或无权访问", 404);
  return resultOk({ feedback });
}

function resolveComActor(actor: AuthTokenPayload) {
  if (actor.site !== "com") return null;
  const actorId = Number(actor.sub);
  return Number.isInteger(actorId) ? actorId : null;
}

// ─── Content Write Operations ───

export interface CreateContentInput {
  contentType: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  domain: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateContentInput {
  title?: string;
  summary?: string;
  body?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
}

export async function createContent(input: CreateContentInput, actor: AuthTokenPayload) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const validation = validateContentInput(input);
  if (validation) return resultError("VALIDATION_ERROR", validation, 400);

  const validTypes = ["tool", "topic", "article", "news"];
  if (!validTypes.includes(input.contentType)) {
    return resultError("VALIDATION_ERROR", "内容类型不正确", 400);
  }

  const record = await createContentRecord({
    site: "com",
    contentType: input.contentType,
    slug: input.slug.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    body: input.body,
    domain: input.domain,
    metadata: input.metadata ?? {},
    status: "draft",
    ownerId: actorId,
  });
  if (!record) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，内容创建失败", 503);

  await createContentVersion({
    contentRecordId: record.id,
    version: 1,
    snapshot: {
      title: record.title,
      summary: record.summary,
      body: record.body,
      domain: record.domain,
      metadata: record.metadata,
    },
    editorId: actorId,
  });

  return resultOk(formatContentRecord(record));
}

export async function updateContent(id: number, input: UpdateContentInput, actor: AuthTokenPayload) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const existing = await getContentRecordById(id);
  if (!existing) return resultError("CONTENT_NOT_FOUND", "内容不存在", 404);
  if (existing.site !== "com") return resultError("FORBIDDEN", "无权操作该内容", 403);
  if (existing.ownerId !== actorId && actor.role !== "operator" && actor.role !== "admin") {
    return resultError("FORBIDDEN", "无权编辑该内容", 403);
  }
  if (existing.status === "published") {
    return resultError("VALIDATION_ERROR", "已发布的内容不能直接编辑，请先撤回", 400);
  }

  const result = await updateContentRecord(id, input);
  if (!result) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，内容更新失败", 503);

  const currentVersion = await getLatestVersionNumber(id);
  await createContentVersion({
    contentRecordId: id,
    version: currentVersion + 1,
    snapshot: {
      title: result.after.title,
      summary: result.after.summary,
      body: result.after.body,
      domain: result.after.domain,
      metadata: result.after.metadata,
    },
    editorId: actorId,
  });

  return resultOk({
    before: formatContentRecord(result.before),
    after: formatContentRecord(result.after),
  });
}

export async function submitContentForReview(id: number, actor: AuthTokenPayload) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const existing = await getContentRecordById(id);
  if (!existing) return resultError("CONTENT_NOT_FOUND", "内容不存在", 404);
  if (existing.site !== "com") return resultError("FORBIDDEN", "无权操作该内容", 403);
  if (existing.ownerId !== actorId && actor.role !== "operator" && actor.role !== "admin") {
    return resultError("FORBIDDEN", "无权提交该内容", 403);
  }
  if (existing.status !== "draft" && existing.status !== "rejected") {
    return resultError("VALIDATION_ERROR", "当前状态不能提交审核", 400);
  }

  const result = await updateContentRecord(id, { status: "pending" });
  if (!result) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，状态更新失败", 503);

  await createModerationTask({
    site: "com",
    type: "content_review",
    targetType: "content_record",
    targetId: String(id),
    title: existing.title,
    reason: "作者提交审核",
  });

  return resultOk(formatContentRecord(result.after));
}

export async function adminListContent(site: string | null, contentType?: string, status?: string) {
  const rows = await listAllContent(site, contentType, status);
  return resultOk({ items: rows.map(formatContentRecord) });
}

export async function adminGetContent(id: number) {
  const record = await getContentRecordById(id);
  if (!record) return resultError("CONTENT_NOT_FOUND", "内容不存在", 404);

  const versions = await listContentVersions(id);
  return resultOk({
    record: formatContentRecord(record),
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      snapshot: v.snapshot,
      editorId: v.editorId,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}

export async function adminUpdateContentStatus(id: number, status: string, actor: AuthTokenPayload) {
  const actorId = resolveComActor(actor);
  if (!actorId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const validStatuses = ["draft", "pending", "published", "archived", "rejected"];
  if (!validStatuses.includes(status)) {
    return resultError("VALIDATION_ERROR", "状态值不正确", 400);
  }

  const existing = await getContentRecordById(id);
  if (!existing) return resultError("CONTENT_NOT_FOUND", "内容不存在", 404);
  if (existing.site !== "com") return resultError("FORBIDDEN", "无权操作该内容", 403);

  const result = await updateContentRecord(id, { status });
  if (!result) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，状态更新失败", 503);

  return resultOk(formatContentRecord(result.after));
}

function validateContentInput(input: CreateContentInput) {
  if (!input.contentType?.trim()) return "请填写内容类型";
  if (!input.slug?.trim()) return "请填写内容标识";
  if (!input.title?.trim()) return "请填写标题";
  if (!input.summary?.trim()) return "请填写摘要";
  if (!input.body?.trim()) return "请填写正文";
  if (!input.domain?.trim()) return "请填写领域";
  return null;
}

function formatContentRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    site: row.site,
    contentType: row.contentType,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    domain: row.domain,
    metadata: row.metadata,
    status: row.status,
    ownerId: row.ownerId,
    publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : null,
  };
}

function validateSolutionInput(input: CreateSolutionRequest) {
  if (!input.title?.trim()) return "请填写方案标题";
  if (!input.targetGoal?.trim()) return "请填写目标";
  if (!input.content?.trim()) return "请填写方案内容";
  if (!Array.isArray(input.toolIds)) return "工具列表格式不正确";
  return null;
}

function validateFavoriteInput(input: Pick<CompassFavoriteRecord, "targetType" | "targetId">) {
  if (
    input.targetType !== "tool" &&
    input.targetType !== "article" &&
    input.targetType !== "topic" &&
    input.targetType !== "news"
  ) {
    return "收藏类型不正确";
  }
  if (!input.targetId?.trim()) return "收藏对象不能为空";
  return null;
}

function formatSolution(solution: SolutionRecord, format: ExportFormat) {
  if (format === "csv") {
    const rows = [
      ["字段", "内容"],
      ["标题", solution.title],
      ["目标", solution.targetGoal],
      ["工具", solution.toolIds.join(" / ")],
      ["方案", solution.content],
      ["创建时间", solution.createdAt],
    ];
    return rows.map((row) => row.map(csvCell).join(",")).join("\n");
  }

  if (format === "txt") {
    return [
      solution.title,
      "",
      `目标：${solution.targetGoal}`,
      `工具：${solution.toolIds.length ? solution.toolIds.join(" / ") : "未指定"}`,
      "",
      solution.content,
    ].join("\n");
  }

  return [
    `# ${solution.title}`,
    "",
    `> 目标：${solution.targetGoal}`,
    "",
    solution.toolIds.length ? `涉及工具：${solution.toolIds.join(" / ")}` : "涉及工具：未指定",
    "",
    solution.content,
  ].join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "pangen-solution";
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 401 | 403 | 404 | 503;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 503,
): Result<never> {
  return { ok: false, error: { code, message, status } };
}
