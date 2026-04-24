import { Hono } from "hono";
import { getNotificationModuleStatus } from "./service";

export const notificationRoute = new Hono();

notificationRoute.get("/api/notification/health", (c) => c.json({ ok: true, data: getNotificationModuleStatus() }));
