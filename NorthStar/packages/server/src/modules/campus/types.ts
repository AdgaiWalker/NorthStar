import type { CreateCampusSpaceRequest, SiteContext, SpaceSummary } from "@ns/shared";

export type { CreateCampusSpaceRequest, SiteContext, SpaceSummary };

export interface CampusModuleStatus {
  module: "campus";
  ready: boolean;
}
