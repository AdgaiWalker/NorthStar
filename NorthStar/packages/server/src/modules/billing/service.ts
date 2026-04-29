import type { AuthTokenPayload } from "../../lib/auth";
import type { CreatePaymentOrderRequest, SiteContext } from "@ns/shared";
import {
  createManualPaymentOrder,
  adjustQuota,
  getOrCreateQuota,
  listAdminPaymentOrders,
  listAdminQuotas,
  listPaymentOrders,
  listQuotaLedger,
  markManualPaymentOrderPaid,
  readBillingModuleStatus,
} from "./repository";
import { writeAuditLog } from "../platform/service";

export function getBillingModuleStatus() {
  return readBillingModuleStatus();
}

export async function readMyQuota(site: SiteContext, actor: AuthTokenPayload) {
  const resolved = resolveBillingActor(site, actor);
  if (!resolved.ok) return resolved;
  const quota = await getOrCreateQuota(resolved.userId, resolved.site);
  if (!quota) return resultError("DATABASE_UNAVAILABLE", "额度服务暂不可用", 503);
  return resultOk({ quota, ledger: await listQuotaLedger(resolved.userId, resolved.site) });
}

export async function readMyPaymentOrders(site: SiteContext, actor: AuthTokenPayload) {
  const resolved = resolveBillingActor(site, actor);
  if (!resolved.ok) return resolved;
  return resultOk({ items: await listPaymentOrders(resolved.userId, resolved.site) });
}

export async function submitPaymentOrder(site: SiteContext, actor: AuthTokenPayload, input: CreatePaymentOrderRequest) {
  const resolved = resolveBillingActor(site, actor);
  if (!resolved.ok) return resolved;

  if (!Number.isInteger(input.credits) || input.credits <= 0 || input.credits > 10000) {
    return resultError("VALIDATION_ERROR", "额度数量不正确", 400);
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
    return resultError("VALIDATION_ERROR", "订单金额不正确", 400);
  }

  const order = await createManualPaymentOrder({
    userId: resolved.userId,
    site: resolved.site,
    credits: input.credits,
    amountCents: input.amountCents,
    currency: input.currency || "CNY",
  });
  if (!order) return resultError("DATABASE_UNAVAILABLE", "订单创建失败", 503);
  return resultOk(order);
}

export async function readAdminBillingOverview(site: SiteContext, actor: AuthTokenPayload) {
  const accessError = resolveBillingAdminAccess(site, actor);
  if (accessError) return accessError;

  return resultOk({
    quotas: await listAdminQuotas(site),
    orders: await listAdminPaymentOrders(site),
  });
}

export async function confirmManualPaymentOrder(site: SiteContext, actor: AuthTokenPayload, orderId: number) {
  const accessError = resolveBillingAdminAccess(site, actor);
  if (accessError) return accessError;
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return resultError("VALIDATION_ERROR", "订单 ID 不正确", 400);
  }

  const order = await markManualPaymentOrderPaid({ id: orderId, site });
  if (!order) return resultError("ORDER_NOT_FOUND", "待确认订单不存在", 404);

  const quota = await adjustQuota({
    userId: Number(order.userId),
    site: order.site,
    delta: order.credits,
    reason: `payment:${order.id}`,
  });
  if (!quota) return resultError("DATABASE_UNAVAILABLE", "额度调整失败", 503);

  await writeAuditLog({
    actorId: toNumberOrNull(actor.sub),
    site: order.site,
    targetType: "payment_order",
    targetId: order.id,
    action: "billing.payment_confirmed",
    before: { status: "pending" },
    after: { status: "paid", credits: order.credits, quotaBalance: quota.aiCreditsRemaining },
  });

  return resultOk({ order, quota });
}

function resolveBillingActor(site: SiteContext, actor: AuthTokenPayload) {
  if (site === "all") return resultError("SITE_FORBIDDEN", "额度不支持跨站查询", 403);
  if (actor.site !== site && actor.role !== "admin") {
    return resultError("SITE_FORBIDDEN", "当前登录态不能访问该站点额度", 403);
  }
  const userId = Number(actor.sub);
  if (!Number.isInteger(userId)) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);
  return { ok: true as const, userId, site };
}

function resolveBillingAdminAccess(site: SiteContext, actor: AuthTokenPayload): ErrorResult | null {
  if (actor.role !== "reviewer" && actor.role !== "operator" && actor.role !== "admin") {
    return resultError("BILLING_FORBIDDEN", "没有额度与支付管理权限", 403);
  }
  if (site === "all" && actor.role !== "admin") {
    return resultError("SITE_FORBIDDEN", "只有 admin 可以跨站查询额度与订单", 403);
  }
  if (site !== "all" && actor.site !== site && actor.role !== "admin") {
    return resultError("SITE_FORBIDDEN", "当前登录态不能访问该站点额度与订单", 403);
  }
  return null;
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

type Result<T> =
  | {
      ok: true;
      data: T;
    }
  | ErrorResult;

interface ErrorResult {
  ok: false;
  error: {
    code: string;
    message: string;
        status: 400 | 401 | 403 | 404 | 503;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(code: string, message: string, status: 400 | 401 | 403 | 404 | 503): ErrorResult {
  return { ok: false, error: { code, message, status } };
}
