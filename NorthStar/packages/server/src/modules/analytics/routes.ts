import { Hono } from "hono";
import type { Context } from "hono";
import type { CreateBehaviorEventRequest } from "@ns/shared";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  AnalyticsPermissionError,
  getAnalyticsModuleStatus,
  readAnalyticsMetrics,
  readBehaviorEvents,
  submitBehaviorEvent,
} from "./service";

export const analyticsRoute = new Hono();

analyticsRoute.get("/api/analytics/health", (c) => c.json({ ok: true, data: getAnalyticsModuleStatus() }));

analyticsRoute.post("/api/analytics/events", async (c) => {
  const result = await submitBehaviorEvent(await readJson<CreateBehaviorEventRequest>(c), resolveAuthUser(c));
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 400, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }
  return ok(c, result.data, 201);
});

analyticsRoute.get("/api/analytics/events", authMiddleware, async (c) => {
  try {
    return ok(c, { items: await readBehaviorEvents(requireSiteContext(c), requireAuthUser(c)) });
  } catch (error) {
    if (error instanceof AnalyticsPermissionError) return fail(c, error.status, "ANALYTICS_FORBIDDEN", error.message);
    throw error;
  }
});

analyticsRoute.get("/api/analytics/metrics", authMiddleware, async (c) => {
  try {
    return ok(c, { items: await readAnalyticsMetrics(requireSiteContext(c), requireAuthUser(c)) });
  } catch (error) {
    if (error instanceof AnalyticsPermissionError) return fail(c, error.status, "ANALYTICS_FORBIDDEN", error.message);
    throw error;
  }
});

async function readJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    return {} as T;
  }
}
