import type { AdminSummary, AuditLogRecord, SiteConfigRecord, SiteContext } from "@ns/shared";

export type { AdminSummary, AuditLogRecord, SiteConfigRecord, SiteContext };

export interface CreateAuditLogInput {
  actorId: number | null;
  site: SiteContext;
  targetType: string;
  targetId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}
