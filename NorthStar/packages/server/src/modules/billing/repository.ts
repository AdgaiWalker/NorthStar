import type { BillingModuleStatus } from "./types";

export function readBillingModuleStatus(): BillingModuleStatus {
  return { module: "billing", ready: true };
}
