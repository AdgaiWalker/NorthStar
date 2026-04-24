import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import {
  createAuditLog,
  getAdminSummary,
  listAdminContent,
  listAdminUsers,
  listAuditLogs,
  listSiteConfigs,
  updateAdminUserRole,
  updateSiteConfig,
} from "./repository";
import type {
  CreateAuditLogInput,
  SiteContext,
  UpdateAdminUserRoleRequest,
  UpdateSiteConfigRequest,
} from "./types";

export async function readAdminSummary(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAdminActor(actor);
  return getAdminSummary(site);
}

export async function readAuditLogs(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAdminActor(actor);
  return listAuditLogs(site);
}

export async function readSiteConfigs(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAdminActor(actor);
  return listSiteConfigs(site);
}

export async function changeSiteConfig(site: SiteContext, actor: AuthTokenPayload, id: number, body: UpdateSiteConfigRequest) {
  assertSiteReadable(site, actor.site, actor.role);
  assertOperatorActor(actor);

  if (!body.value || typeof body.value !== "object" || Array.isArray(body.value)) {
    return resultError("VALIDATION_ERROR", "配置内容必须是 JSON 对象", 400);
  }

  const actorId = toNumberOrNull(actor.sub);
  const result = await updateSiteConfig(site, id, body.value, actorId);
  if (!result) return resultError("CONFIG_NOT_FOUND", "系统配置不存在", 404);

  await writeAuditLog({
    actorId,
    site,
    targetType: "site_config",
    targetId: String(id),
    action: "admin.site_config_updated",
    before: { ...result.before },
    after: { ...result.after },
  });

  return resultOk(result.after);
}

export async function readAdminUsers(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAdminActor(actor);
  return listAdminUsers(site);
}

export async function changeAdminUserRole(
  site: SiteContext,
  actor: AuthTokenPayload,
  id: number,
  body: UpdateAdminUserRoleRequest,
) {
  assertSiteReadable(site, actor.site, actor.role);
  assertRootAdmin(actor);

  if (!isMutableRole(body.role)) return resultError("VALIDATION_ERROR", "用户角色不正确", 400);

  const actorId = toNumberOrNull(actor.sub);
  const result = await updateAdminUserRole(site, id, body.role);
  if (!result) return resultError("USER_NOT_FOUND", "用户不存在", 404);

  await writeAuditLog({
    actorId,
    site,
    targetType: "user",
    targetId: String(id),
    action: "admin.user_role_updated",
    before: { ...result.before },
    after: { ...result.after },
  });

  return resultOk(result.after);
}

export async function readAdminContent(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAdminActor(actor);
  return listAdminContent(site);
}

export async function writeAuditLog(input: CreateAuditLogInput) {
  return createAuditLog(input);
}

function assertAdminActor(actor: AuthTokenPayload) {
  if (actor.role === "reviewer" || actor.role === "operator" || actor.role === "admin") return;
  throw new PlatformPermissionError("没有后台访问权限");
}

function assertOperatorActor(actor: AuthTokenPayload) {
  if (actor.role === "operator" || actor.role === "admin") return;
  throw new PlatformPermissionError("没有后台配置权限");
}

function assertRootAdmin(actor: AuthTokenPayload) {
  if (actor.role === "admin") return;
  throw new PlatformPermissionError("只有管理员可以调整用户角色");
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function isMutableRole(value: unknown): value is UpdateAdminUserRoleRequest["role"] {
  return value === "user" || value === "editor" || value === "reviewer" || value === "operator" || value === "admin";
}

export class PlatformPermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "PlatformPermissionError";
  }
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 403 | 404;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(code: string, message: string, status: 400 | 403 | 404): Result<never> {
  return { ok: false, error: { code, message, status } };
}
