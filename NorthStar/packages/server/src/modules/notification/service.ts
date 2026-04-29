import { readNotificationModuleStatus } from "./repository";
import { listNotificationsFromDb, markNotificationReadInDb } from "../../data/postgres";
import type { AuthTokenPayload } from "../../lib/auth";

export function getNotificationModuleStatus() {
  return readNotificationModuleStatus();
}

export async function readUserNotifications(actor: AuthTokenPayload) {
  const userId = Number(actor.sub);
  if (!Number.isInteger(userId)) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const site = actor.site === "com" ? "com" : "cn";
  const notifications = await listNotificationsFromDb(userId, site);
  if (!notifications) return resultError("DATABASE_UNAVAILABLE", "通知服务暂不可用", 503);
  return resultOk({ notifications });
}

export async function markUserNotificationRead(actor: AuthTokenPayload, id: string) {
  const userId = Number(actor.sub);
  if (!Number.isInteger(userId)) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const site = actor.site === "com" ? "com" : "cn";
  const notification = await markNotificationReadInDb(id, userId, site);
  if (!notification) return resultError("NOTIFICATION_NOT_FOUND", "通知不存在", 404);
  return resultOk({ notification });
}

type Result<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        status: 401 | 404 | 503;
      };
    };

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(code: string, message: string, status: 401 | 404 | 503): Result<never> {
  return { ok: false, error: { code, message, status } };
}
