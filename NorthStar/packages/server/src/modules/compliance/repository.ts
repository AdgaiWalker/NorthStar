import type { ComplianceModuleStatus } from "./types";

export function readComplianceModuleStatus(): ComplianceModuleStatus {
  return { module: "compliance", ready: true };
}
