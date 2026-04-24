import type { SiteContext } from './site';

export type AdminRole = 'reviewer' | 'operator' | 'admin';

export interface AdminActor {
  id: string;
  name: string;
  role: AdminRole;
  site: SiteContext;
}

export interface AdminSummary {
  site: SiteContext;
  reviewPendingCount: number;
  auditLogCount: number;
  userCount: number;
  contentCount: number;
}

export interface AdminListQuery {
  site: SiteContext;
  keyword?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export interface SiteConfigRecord {
  id: string;
  site: SiteContext;
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

export interface UpdateSiteConfigRequest {
  value: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  site: SiteContext;
  targetType: string;
  targetId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'editor' | 'reviewer' | 'operator' | 'admin';
  site: SiteContext;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string;
}

export interface UpdateAdminUserRoleRequest {
  role: 'user' | 'editor' | 'reviewer' | 'operator' | 'admin';
}

export interface AdminContentRecord {
  id: string;
  site: SiteContext;
  type: 'article' | 'post';
  title: string;
  authorId: string;
  status: string;
  createdAt: string;
}
