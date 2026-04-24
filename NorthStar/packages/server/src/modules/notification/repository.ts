import type { NotificationModuleStatus } from "./types";

export function readNotificationModuleStatus(): NotificationModuleStatus {
  return { module: "notification", ready: true };
}
