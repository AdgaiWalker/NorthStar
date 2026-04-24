import { Hono } from "hono";
import type { Context } from "hono";
import { SiteAccessError } from "../../db/site-aware";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  changeAdminUserRole,
  changeSiteConfig,
  PlatformPermissionError,
  readAdminContent,
  readAdminSummary,
  readAdminUsers,
  readAuditLogs,
  readSiteConfigs,
} from "./service";
import type { UpdateAdminUserRoleRequest, UpdateSiteConfigRequest } from "./types";

export const platformRoute = new Hono();

platformRoute.use("/api/admin/*", authMiddleware);

platformRoute.get("/api/admin/summary", async (c) => {
  try {
    const summary = await readAdminSummary(requireSiteContext(c), requireAuthUser(c));
    return ok(c, summary);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

platformRoute.get("/api/admin/audit-logs", async (c) => {
  try {
    const auditLogs = await readAuditLogs(requireSiteContext(c), requireAuthUser(c));
    return ok(c, { items: auditLogs });
  } catch (error) {
    return handleKnownError(c, error);
  }
});

platformRoute.get("/api/admin/site-configs", async (c) => {
  try {
    const configs = await readSiteConfigs(requireSiteContext(c), requireAuthUser(c));
    return ok(c, { items: configs });
  } catch (error) {
    return handleKnownError(c, error);
  }
});

platformRoute.patch("/api/admin/site-configs/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return fail(c, 400, "VALIDATION_ERROR", "配置 ID 不正确");

  try {
    const result = await changeSiteConfig(
      requireSiteContext(c),
      requireAuthUser(c),
      id,
      await readJson<UpdateSiteConfigRequest>(c),
    );
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

platformRoute.get("/api/admin/users", async (c) => {
  try {
    const users = await readAdminUsers(requireSiteContext(c), requireAuthUser(c));
    return ok(c, { items: users });
  } catch (error) {
    return handleKnownError(c, error);
  }
});

platformRoute.patch("/api/admin/users/:id/role", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return fail(c, 400, "VALIDATION_ERROR", "用户 ID 不正确");

  try {
    const result = await changeAdminUserRole(
      requireSiteContext(c),
      requireAuthUser(c),
      id,
      await readJson<UpdateAdminUserRoleRequest>(c),
    );
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

platformRoute.get("/api/admin/content", async (c) => {
  try {
    const content = await readAdminContent(requireSiteContext(c), requireAuthUser(c));
    return ok(c, { items: content });
  } catch (error) {
    return handleKnownError(c, error);
  }
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
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 403 | 404 } },
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T);
}

function handleKnownError(c: Context, error: unknown) {
  if (error instanceof SiteAccessError) return fail(c, error.status, "SITE_FORBIDDEN", error.message);
  if (error instanceof PlatformPermissionError) return fail(c, error.status, "ADMIN_FORBIDDEN", error.message);
  throw error;
}
