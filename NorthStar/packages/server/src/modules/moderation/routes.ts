import { Hono } from "hono";
import { SiteAccessError } from "../../db/site-aware";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  changeModerationTaskStatus,
  readModerationTask,
  readModerationTasks,
  submitModerationTask,
} from "./service";
import { ModerationPermissionError } from "./service";
import type { CreateModerationTaskRequest, UpdateModerationTaskStatusRequest } from "./types";

export const moderationRoute = new Hono();

moderationRoute.use("/api/moderation/*", authMiddleware);

moderationRoute.get("/api/moderation/tasks", async (c) => {
  try {
    const tasks = await readModerationTasks(requireSiteContext(c), requireAuthUser(c));
    return ok(c, { items: tasks });
  } catch (error) {
    if (error instanceof SiteAccessError) return fail(c, error.status, "SITE_FORBIDDEN", error.message);
    if (error instanceof ModerationPermissionError) return fail(c, error.status, "MODERATION_FORBIDDEN", error.message);
    throw error;
  }
});

moderationRoute.post("/api/moderation/tasks", async (c) => {
  let body: CreateModerationTaskRequest | null = null;

  try {
    body = await c.req.json<CreateModerationTaskRequest>();
  } catch {
    body = null;
  }

  const validation = validateCreateTask(body);
  if (validation) return fail(c, 400, "VALIDATION_ERROR", validation);

  try {
    const task = await submitModerationTask(body!, requireAuthUser(c));
    return ok(c, task, 201);
  } catch (error) {
    if (error instanceof SiteAccessError) return fail(c, error.status, "SITE_FORBIDDEN", error.message);
    throw error;
  }
});

moderationRoute.get("/api/moderation/tasks/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return fail(c, 400, "VALIDATION_ERROR", "审核任务 ID 不正确");

  try {
    const task = await readModerationTask(requireSiteContext(c), requireAuthUser(c), id);
    if (!task) return fail(c, 404, "TASK_NOT_FOUND", "审核任务不存在");
    return ok(c, task);
  } catch (error) {
    if (error instanceof SiteAccessError) return fail(c, error.status, "SITE_FORBIDDEN", error.message);
    if (error instanceof ModerationPermissionError) return fail(c, error.status, "MODERATION_FORBIDDEN", error.message);
    throw error;
  }
});

moderationRoute.patch("/api/moderation/tasks/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return fail(c, 400, "VALIDATION_ERROR", "审核任务 ID 不正确");

  let body: UpdateModerationTaskStatusRequest | null = null;

  try {
    body = await c.req.json<UpdateModerationTaskStatusRequest>();
  } catch {
    body = null;
  }

  if (!body?.status) return fail(c, 400, "VALIDATION_ERROR", "请提供新的审核状态");

  try {
    const result = await changeModerationTaskStatus(requireSiteContext(c), requireAuthUser(c), id, body);
    if (!result) return fail(c, 404, "TASK_NOT_FOUND", "审核任务不存在");
    if ("error" in result) return fail(c, 409, "INVALID_STATUS_TRANSITION", result.error ?? "审核状态流转不符合规则", { task: result.task });
    return ok(c, result.task);
  } catch (error) {
    if (error instanceof SiteAccessError) return fail(c, error.status, "SITE_FORBIDDEN", error.message);
    if (error instanceof ModerationPermissionError) return fail(c, error.status, "MODERATION_FORBIDDEN", error.message);
    throw error;
  }
});

function validateCreateTask(body: CreateModerationTaskRequest | null) {
  if (!body) return "请求格式不正确";
  if (body.site !== "cn" && body.site !== "com") return "审核任务必须归属具体站点";
  if (!body.type) return "请提供审核任务类型";
  if (!body.targetType?.trim()) return "请提供审核目标类型";
  if (!body.targetId?.trim()) return "请提供审核目标 ID";
  if (!body.title?.trim()) return "请提供审核标题";
  return null;
}
