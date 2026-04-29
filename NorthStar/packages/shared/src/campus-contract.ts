export interface CreateCampusSpaceRequest {
  slug: string;
  title: string;
  description: string;
  category: string;
}

export interface SpaceClaimScanRequest {
  candidateUserId?: string;
  olderThanDays?: number;
  limit?: number;
}

export interface SpaceClaimScanItem {
  taskId: string;
  spaceId: string;
  spaceSlug: string;
  spaceTitle: string;
  currentOwnerId: string;
  candidateUserId: string;
  lastActiveAt: string;
}

export interface SpaceClaimScanResponse {
  items: SpaceClaimScanItem[];
  createdCount: number;
  skippedCount: number;
}
