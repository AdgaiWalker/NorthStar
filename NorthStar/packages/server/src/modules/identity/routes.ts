import { Hono } from "hono";
import { getIdentityModuleStatus } from "./service";

export const identityRoute = new Hono();

identityRoute.get("/api/identity/health", (c) => c.json({ ok: true, data: getIdentityModuleStatus() }));
