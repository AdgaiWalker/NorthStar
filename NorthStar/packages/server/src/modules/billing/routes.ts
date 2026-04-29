import { Hono } from "hono";
import type { Context } from "hono";
import type { CreatePaymentOrderRequest } from "@ns/shared";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  confirmManualPaymentOrder,
  getBillingModuleStatus,
  readAdminBillingOverview,
  readMyPaymentOrders,
  readMyQuota,
  submitPaymentOrder,
} from "./service";

export const billingRoute = new Hono();

billingRoute.get("/api/billing/health", (c) => c.json({ ok: true, data: getBillingModuleStatus() }));

billingRoute.use("/api/billing/*", authMiddleware);

billingRoute.get("/api/billing/quota", async (c) => sendResult(c, await readMyQuota(requireSiteContext(c), requireAuthUser(c))));

billingRoute.get("/api/billing/admin/overview", async (c) =>
  sendResult(c, await readAdminBillingOverview(requireSiteContext(c), requireAuthUser(c))),
);

billingRoute.get("/api/billing/orders", async (c) =>
  sendResult(c, await readMyPaymentOrders(requireSiteContext(c), requireAuthUser(c))),
);

billingRoute.post("/api/billing/orders", async (c) =>
  sendResult(c, await submitPaymentOrder(requireSiteContext(c), requireAuthUser(c), await readJson<CreatePaymentOrderRequest>(c)), 201),
);

billingRoute.post("/api/billing/admin/orders/:id/confirm", async (c) => {
  const id = Number(c.req.param("id"));
  return sendResult(c, await confirmManualPaymentOrder(requireSiteContext(c), requireAuthUser(c), id));
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
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 400 | 401 | 403 | 404 | 503 } },
  successStatus: 200 | 201 = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}
