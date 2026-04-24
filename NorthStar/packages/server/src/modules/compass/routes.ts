import { Hono } from "hono";
import { getCompassModuleStatus } from "./service";

export const compassRoute = new Hono();

compassRoute.get("/api/compass/health", (c) => c.json({ ok: true, data: getCompassModuleStatus() }));
