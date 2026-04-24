import { readBillingModuleStatus } from "./repository";

export function getBillingModuleStatus() {
  return readBillingModuleStatus();
}
