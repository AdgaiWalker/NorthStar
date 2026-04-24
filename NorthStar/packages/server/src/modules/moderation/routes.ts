import { Hono } from "hono";
import { SiteAccessError } from "../../db/site-aware";
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
    return c.json({ ok: true, data: { items: tasks } });
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    if (error instanceof ModerationPermissionError) return c.json({ ok: false, error: error.message }, error.status);
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
  if (validation) return c.json({ ok: false, error: validation }, 400);

  try {
    const task = await submitModerationTask(body!, requireAuthUser(c));
    return c.json({ ok: true, data: task }, 201);
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    throw error;
  }
});

moderationRoute.get("/api/moderation/tasks/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ ok: false, error: "审核任务 ID 不正确" }, 400);

  try {
    const task = await readModerationTask(requireSiteContext(c), requireAuthUser(c), id);
    if (!task) return c.json({ ok: false, error: "审核任务不存在" }, 404);
    return c.json({ ok: true, data: task });
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    if (error instanceof ModerationPermissionError) return c.json({ ok: false, error: error.message }, error.status);
    throw error;
  }
});

moderationRoute.patch("/api/moderation/tasks/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ ok: false, error: "审核任务 ID 不正确" }, 400);

  let body: UpdateModerationTaskStatusRequest | null = null;

  try {
    body = await c.req.json<UpdateModerationTaskStatusRequest>();
  } catch {
    body = null;
  }

  if (!body?.status) return c.json({ ok: false, error: "请提供新的审核状态" }, 400);

  try {
    const result = await changeModerationTaskStatus(requireSiteContext(c), requireAuthUser(c), id, body);
    if (!result) return c.json({ ok: false, error: "审核任务不存在" }, 404);
    if ("error" in result) return c.json({ ok: false, error: result.error, data: result.task }, 409);
    return c.json({ ok: true, data: result.task });
  } catch (error) {
    if (error instanceof SiteAccessError) return c.json({ ok: false, error: error.message }, error.status);
    if (error instanceof ModerationPermissionError) return c.json({ ok: false, error: error.message }, error.status);
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
