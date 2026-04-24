import { Hono } from "hono";
import { getBillingModuleStatus } from "./service";

export const billingRoute = new Hono();

billingRoute.get("/api/billing/health", (c) => c.json({ ok: true, data: getBillingModuleStatus() }));
