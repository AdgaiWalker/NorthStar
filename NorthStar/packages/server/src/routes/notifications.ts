import { Hono } from "hono";
import { listNotificationsFromDb, markNotificationReadInDb } from "../data/postgres";
import { authMiddleware } from "../middleware/auth";
import { requireAuthUser } from "../middleware/auth";

export const notificationsRoute = new Hono();

notificationsRoute.use("/api/notifications", authMiddleware);
notificationsRoute.use("/api/notifications/*", authMiddleware);

notificationsRoute.get("/api/notifications", async (c) => {
  const notifications = await listNotificationsFromDb(Number(requireAuthUser(c).sub));
  return c.json({ notifications: notifications ?? [] });
});

notificationsRoute.post("/api/notifications/:id/read", async (c) => {
  const notification = await markNotificationReadInDb(c.req.param("id"), Number(requireAuthUser(c).sub));
  if (!notification) return c.json({ error: "Notification not found" }, 404);
  return c.json({ notification });
});
