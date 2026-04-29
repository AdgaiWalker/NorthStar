import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import { db } from "../../db/client";
import {
  articles,
  behaviorEvents,
  compassFavorites,
  favorites,
  feedbacks,
  posts,
  solutionExports,
  solutionFeedbacks,
  solutions,
  users,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { invalidateUserTokens } from "../identity/repository";
import { writeAuditLog } from "../platform/service";
import {
  createAccountDeletionRequest,
  createUserConsent,
  exportUserData,
  listAccountDeletionRequests,
  listLegalDocuments,
  readComplianceModuleStatus,
  updateAccountDeletionRequestStatus,
} from "./repository";
import type {
  AccountDeletionRequestInput,
  AccountDeletionStatus,
  ConsentRequest,
  SiteContext,
} from "./types";

export function getComplianceModuleStatus() {
  return readComplianceModuleStatus();
}

export function readLegalDocuments(site: SiteContext, type?: string) {
  return listLegalDocuments(site, type);
}

export async function recordConsent(actor: AuthTokenPayload, input: ConsentRequest) {
  const userId = toNumberOrNull(actor.sub);
  if (!userId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);
  assertSiteReadable(input.site, actor.site, actor.role);
  if (!input.version?.trim()) return resultError("VALIDATION_ERROR", "请提供协议版本", 400);

  return resultOk({ items: await createUserConsent(userId, input.site, input.version.trim()) });
}

export async function readUserDataExport(actor: AuthTokenPayload) {
  const userId = toNumberOrNull(actor.sub);
  const site = actor.site === "com" ? "com" : "cn";
  if (!userId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const data = await exportUserData(userId, site);
  if (!data) return resultError("USER_NOT_FOUND", "用户不存在", 404);

  return resultOk(data);
}

export async function submitDeletionRequest(actor: AuthTokenPayload, input: AccountDeletionRequestInput) {
  const userId = toNumberOrNull(actor.sub);
  const site = actor.site === "com" ? "com" : "cn";
  if (!userId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const request = await createAccountDeletionRequest(userId, site, input.reason);
  if (!request) return resultError("DATABASE_UNAVAILABLE", "数据库未连接，无法提交注销申请", 503);

  return resultOk(request);
}

export async function readDeletionRequests(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);
  return resultOk({ items: await listAccountDeletionRequests(site) });
}

export async function changeDeletionRequestStatus(
  site: SiteContext,
  actor: AuthTokenPayload,
  id: number,
  status: AccountDeletionStatus,
) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);

  const actorId = toNumberOrNull(actor.sub);
  const result = await updateAccountDeletionRequestStatus(site, id, status, actorId);
  if (!result) return resultError("REQUEST_NOT_FOUND", "注销申请不存在", 404);

  if (status === "completed") {
    await invalidateUserTokens(Number(result.after.userId));

    // 异步数据清除：删除用户关联数据，匿名化用户记录
    if (db) {
      const userId = Number(result.after.userId);

      await db.delete(posts).where(eq(posts.authorId, userId));
      await db.delete(articles).where(eq(articles.authorId, userId));
      await db.delete(feedbacks).where(eq(feedbacks.userId, userId));
      await db.delete(favorites).where(eq(favorites.userId, userId));
      await db.delete(solutionFeedbacks).where(eq(solutionFeedbacks.userId, userId));
      await db.delete(solutionExports).where(eq(solutionExports.userId, userId));
      await db.delete(solutions).where(eq(solutions.userId, userId));
      await db.delete(behaviorEvents).where(eq(behaviorEvents.userId, userId));
      await db.delete(compassFavorites).where(eq(compassFavorites.userId, userId));

      // 匿名化用户记录（保留 id，清除个人信息）
      await db
        .update(users)
        .set({
          email: null,
          username: `deleted_${userId}`,
          phone: null,
          wxOpenId: null,
          githubId: null,
          nickname: "已注销用户",
          avatar: null,
          passwordHash: null,
          disabledAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  await writeAuditLog({
    actorId,
    site,
    targetType: "account_deletion_request",
    targetId: String(id),
    action: "compliance.deletion_status_changed",
    before: { ...result.before },
    after: { ...result.after },
  });

  return resultOk(result.after);
}

function assertComplianceOperator(actor: AuthTokenPayload) {
  if (actor.role === "reviewer" || actor.role === "operator" || actor.role === "admin") return;
  throw new CompliancePermissionError("没有合规后台权限");
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export class CompliancePermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "CompliancePermissionError";
  }
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
