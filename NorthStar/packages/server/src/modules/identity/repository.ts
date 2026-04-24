import type { IdentityModuleStatus } from "./types";

export function readIdentityModuleStatus(): IdentityModuleStatus {
  return { module: "identity", ready: true };
}
