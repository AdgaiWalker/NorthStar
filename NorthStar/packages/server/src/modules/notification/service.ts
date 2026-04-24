import { readNotificationModuleStatus } from "./repository";

export function getNotificationModuleStatus() {
  return readNotificationModuleStatus();
}
