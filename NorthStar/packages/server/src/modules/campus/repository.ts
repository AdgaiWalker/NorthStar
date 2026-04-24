import type { CampusModuleStatus } from "./types";

export function readCampusModuleStatus(): CampusModuleStatus {
  return { module: "campus", ready: true };
}
