import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import { eq, sql } from "drizzle-orm";
import type { CapabilitySite } from "@ns/shared";
import { db } from "../../db/client";
import { siteConfigs, users } from "../../db/schema";
import { getOrCreateQuota } from "../billing/repository";
import {
  createAuditLog,
  getAdminSummary,
  getContentQualityReport,
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

export async function readContentQualityReport(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertAdminActor(actor);
  return getContentQualityReport(site);
}

export async function readPlatformCapabilities(site: CapabilitySite, actor: AuthTokenPayload | null) {
  const user = actor ? await readCapabilityUser(Number(actor.sub)) : null;

  if (site === "campus") {
    const canUseCampus = !actor || actor.site === "cn";
    const role = user?.role ?? actor?.role;
    const trustLevel = user?.trustLevel;
    const canPost = canUseCampus && Boolean(actor);
    const canWriteArticle =
      canUseCampus &&
      Boolean(actor) &&
      (role === "editor" || role === "reviewer" || role === "operator" || role === "admin" || trustLevel === "author" || trustLevel === "senior");
    const canCreateSpace =
      canUseCampus && Boolean(actor) && (role === "editor" || role === "admin" || trustLevel === "senior" || trustLevel === "admin");

    const quota = actor && canUseCampus ? await readCapabilityQuota(actor, "cn") : null;

    return {
      site: "campus" as const,
      canPost,
      canWriteArticle,
      canCreateSpace,
      canUseAiSearch: canUseCampus,
      aiSearchRemaining: actor ? quota?.aiCreditsRemaining ?? 0 : 3,
      lockedReason: canUseCampus ? null : "当前登录态不属于校园站，请切换账号后重试",
    };
  }

  const canUseCompass = !actor || actor.site === "com";
  const role = user?.role ?? actor?.role;
  const canSave = canUseCompass && Boolean(actor);
  const canSubmitContent = canUseCompass && (role === "editor" || role === "reviewer" || role === "operator" || role === "admin");
  const quota = actor && canUseCompass ? await readCapabilityQuota(actor, "com") : null;

  return {
    site: "compass" as const,
    canGenerateSolution: canUseCompass,
    canSaveSolution: canSave,
    canExportSolution: canSave,
    canSubmitContent,
    solutionRemaining: actor ? quota?.aiCreditsRemaining ?? 0 : 1,
    lockedReason: canUseCompass ? null : "当前登录态不属于全球站，请切换账号后重试",
  };
}

export async function writeAuditLog(input: CreateAuditLogInput) {
  return createAuditLog(input);
}

async function readCapabilityUser(userId: number) {
  if (!db || !Number.isInteger(userId)) return null;

  const rows = await db
    .select({
      role: users.role,
      trustLevel: users.trustLevel,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

async function readCapabilityQuota(actor: AuthTokenPayload, site: "cn" | "com") {
  const userId = toNumberOrNull(actor.sub);
  if (userId === null) return null;
  return getOrCreateQuota(userId, site);
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

export async function readFeatureFlags(site: string) {
  if (!db) return { site, flags: {} as Record<string, unknown> };

  const rows = await db
    .select({
      key: siteConfigs.key,
      value: siteConfigs.value,
    })
    .from(siteConfigs)
    .where(
      sql`${siteConfigs.site} = ${site === "campus" ? "cn" : "com"} and ${siteConfigs.key} like 'feature_flag_%'`,
    );

  const flags: Record<string, unknown> = {};
  for (const row of rows) {
    const flagName = row.key.replace("feature_flag_", "");
    flags[flagName] = row.value;
  }

  return { site, flags };
}
