import type { CompassModuleStatus } from "./types";

export function readCompassModuleStatus(): CompassModuleStatus {
  return { module: "compass", ready: true };
}
