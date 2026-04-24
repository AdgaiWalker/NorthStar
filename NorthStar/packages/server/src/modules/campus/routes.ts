import { Hono } from "hono";
import { getCampusModuleStatus } from "./service";

export const campusRoute = new Hono();

campusRoute.get("/api/campus/health", (c) => c.json({ ok: true, data: getCampusModuleStatus() }));
