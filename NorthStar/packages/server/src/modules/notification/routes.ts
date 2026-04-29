import { Hono } from "hono";
import type { Context } from "hono";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { getNotificationModuleStatus, markUserNotificationRead, readUserNotifications } from "./service";
import { listDevDeliveryLog } from "./email-provider";

export const notificationRoute = new Hono();

notificationRoute.get("/api/notification/health", (c) => c.json({ ok: true, data: getNotificationModuleStatus() }));

notificationRoute.get("/api/notification/inbox", authMiddleware, async (c) => {
  const result = await readUserNotifications(requireAuthUser(c));
  return sendResult(c, result);
});

notificationRoute.post("/api/notification/:id/read", authMiddleware, async (c) => {
  const result = await markUserNotificationRead(requireAuthUser(c), c.req.param("id"));
  return sendResult(c, result);
});

notificationRoute.get("/api/notification/email-deliveries", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (actor.role !== "admin" && actor.role !== "operator") {
    return fail(c, 403, "EMAIL_DELIVERY_FORBIDDEN", "没有查看邮件投递记录的权限");
  }
  return ok(c, { deliveries: listDevDeliveryLog() });
});

function sendResult<T>(
  c: Context,
  result: { ok: boolean; data?: T; error?: { code: string; message: string; status: 401 | 404 | 503 } },
) {
  if (!result.ok || result.error) {
    return fail(c, result.error?.status ?? 503, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T);
}
