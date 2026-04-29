import type {
  CreateCampusSpaceRequest,
  SiteContext,
  SpaceClaimScanRequest,
  SpaceClaimScanResponse,
  SpaceSummary,
} from "@ns/shared";

export type { CreateCampusSpaceRequest, SiteContext, SpaceClaimScanRequest, SpaceClaimScanResponse, SpaceSummary };

export interface CampusModuleStatus {
  module: "campus";
  ready: boolean;
}
