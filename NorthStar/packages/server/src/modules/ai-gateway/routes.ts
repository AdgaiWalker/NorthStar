import { Hono } from "hono";
import { getAiGatewayModuleStatus } from "./service";

export const aiGatewayRoute = new Hono();

aiGatewayRoute.get("/api/ai-gateway/health", (c) => c.json({ ok: true, data: getAiGatewayModuleStatus() }));
