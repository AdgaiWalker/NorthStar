import { readComplianceModuleStatus } from "./repository";

export function getComplianceModuleStatus() {
  return readComplianceModuleStatus();
}
