import { Hono } from "hono";
import { getAnalyticsModuleStatus } from "./service";

export const analyticsRoute = new Hono();

analyticsRoute.get("/api/analytics/health", (c) => c.json({ ok: true, data: getAnalyticsModuleStatus() }));
