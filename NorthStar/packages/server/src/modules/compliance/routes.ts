import { Hono } from "hono";
import { getComplianceModuleStatus } from "./service";

export const complianceRoute = new Hono();

complianceRoute.get("/api/compliance/health", (c) => c.json({ ok: true, data: getComplianceModuleStatus() }));
