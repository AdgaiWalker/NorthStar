import type { BillingModuleStatus } from "./types";
import type { PaymentOrderRecord, QuotaLedgerRecord, QuotaRecord, SiteContext } from "@ns/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { paymentOrders, quotaLedger, quotas } from "../../db/schema";

export function readBillingModuleStatus(): BillingModuleStatus {
  return { module: "billing", ready: true };
}

export async function getOrCreateQuota(userId: number, site: Exclude<SiteContext, "all">) {
  if (!db) return null;

  const existing = await readQuota(userId, site);
  if (existing) return existing;

  const [row] = await db
    .insert(quotas)
    .values({
      userId,
      site,
      aiCreditsRemaining: site === "com" ? 10 : 20,
    })
    .returning();

  return row ? toQuota(row) : null;
}

export async function adjustQuota(input: {
  userId: number;
  site: Exclude<SiteContext, "all">;
  delta: number;
  reason: string;
}) {
  if (!db) return null;

  const quota = await getOrCreateQuota(input.userId, input.site);
  if (!quota) return null;

  const nextBalance = Math.max(0, quota.aiCreditsRemaining + input.delta);
  const [row] = await db
    .update(quotas)
    .set({ aiCreditsRemaining: nextBalance, updatedAt: new Date() })
    .where(and(eq(quotas.userId, input.userId), eq(quotas.site, input.site)))
    .returning();

  await db.insert(quotaLedger).values({
    userId: input.userId,
    site: input.site,
    delta: input.delta,
    reason: input.reason,
    balanceAfter: nextBalance,
  });

  return row ? toQuota(row) : null;
}

export async function consumeQuota(input: {
  userId: number;
  site: Exclude<SiteContext, "all">;
  amount: number;
  reason: string;
}) {
  if (!db) return null;
  if (!Number.isInteger(input.amount) || input.amount <= 0) return null;

  const quota = await getOrCreateQuota(input.userId, input.site);
  if (!quota) return null;
  if (quota.aiCreditsRemaining < input.amount) {
    return { ok: false as const, quota };
  }

  const next = await adjustQuota({
    userId: input.userId,
    site: input.site,
    delta: -input.amount,
    reason: input.reason,
  });
  if (!next) return null;

  return { ok: true as const, quota: next };
}

export async function listQuotaLedger(userId: number, site: Exclude<SiteContext, "all">) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(quotaLedger)
    .where(and(eq(quotaLedger.userId, userId), eq(quotaLedger.site, site)))
    .orderBy(desc(quotaLedger.createdAt))
    .limit(100);

  return rows.map(toLedger);
}

export async function createManualPaymentOrder(input: {
  userId: number;
  site: Exclude<SiteContext, "all">;
  credits: number;
  amountCents: number;
  currency: string;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(paymentOrders)
    .values({
      userId: input.userId,
      site: input.site,
      provider: "manual",
      status: "pending",
      credits: input.credits,
      amountCents: input.amountCents,
      currency: input.currency,
    })
    .returning();

  return row ? toOrder(row) : null;
}

export async function listPaymentOrders(userId: number, site: Exclude<SiteContext, "all">) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(paymentOrders)
    .where(and(eq(paymentOrders.userId, userId), eq(paymentOrders.site, site)))
    .orderBy(desc(paymentOrders.createdAt))
    .limit(100);

  return rows.map(toOrder);
}

export async function listAdminQuotas(site: SiteContext) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(quotas)
    .where(site === "all" ? sql`true` : eq(quotas.site, site))
    .orderBy(desc(quotas.updatedAt))
    .limit(200);

  return rows.map(toQuota);
}

export async function listAdminPaymentOrders(site: SiteContext) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(paymentOrders)
    .where(site === "all" ? sql`true` : eq(paymentOrders.site, site))
    .orderBy(desc(paymentOrders.createdAt))
    .limit(200);

  return rows.map(toOrder);
}

export async function markManualPaymentOrderPaid(input: { id: number; site: SiteContext }) {
  if (!db) return null;

  const [row] = await db
    .update(paymentOrders)
    .set({ status: "paid", paidAt: new Date() })
    .where(
      and(
        eq(paymentOrders.id, input.id),
        eq(paymentOrders.status, "pending"),
        input.site === "all" ? sql`true` : eq(paymentOrders.site, input.site),
      ),
    )
    .returning();

  return row ? toOrder(row) : null;
}

async function readQuota(userId: number, site: Exclude<SiteContext, "all">) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(quotas)
    .where(and(eq(quotas.userId, userId), eq(quotas.site, site)))
    .limit(1);

  return rows[0] ? toQuota(rows[0]) : null;
}

function toQuota(row: typeof quotas.$inferSelect): QuotaRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    site: row.site === "com" ? "com" : "cn",
    aiCreditsRemaining: row.aiCreditsRemaining,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toLedger(row: typeof quotaLedger.$inferSelect): QuotaLedgerRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    site: row.site === "com" ? "com" : "cn",
    delta: row.delta,
    reason: row.reason,
    balanceAfter: row.balanceAfter,
    createdAt: row.createdAt.toISOString(),
  };
}

function toOrder(row: typeof paymentOrders.$inferSelect): PaymentOrderRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    site: row.site === "com" ? "com" : "cn",
    provider: row.provider === "stripe" || row.provider === "wechat" || row.provider === "alipay" ? row.provider : "manual",
    status:
      row.status === "paid" || row.status === "cancelled" || row.status === "refunded" ? row.status : "pending",
    amountCents: row.amountCents,
    currency: row.currency,
    credits: row.credits,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString(),
  };
}
