import type { AnalyticsModuleStatus } from "./types";

export function readAnalyticsModuleStatus(): AnalyticsModuleStatus {
  return { module: "analytics", ready: true };
}
