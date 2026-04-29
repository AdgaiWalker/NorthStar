import type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  AnalyticsMetric,
  AuditLogRecord,
  IdentitySession,
  ModerationTaskRecord,
  PaymentOrderRecord,
  QuotaRecord,
  BehaviorEventRecord,
  SiteConfigRecord,
  SiteContext,
  UpdateAdminUserRoleRequest,
  UpdateSiteConfigRequest,
} from "@ns/shared";

interface ApiResponse<T> {
  ok?: boolean;
  data?: T;
  error?: string | { message?: string };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export interface CompassContentDetail {
  record: {
    id: number;
    site: string;
    contentType: string;
    slug: string;
    title: string;
    summary: string | null;
    body: string | null;
    domain: string | null;
    metadata: Record<string, unknown> | null;
    status: string;
    ownerId: string | null;
    publishedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  versions: Array<{ id: number; version: number; snapshot: unknown; editorId: string | null; createdAt: string }>;
}

export async function requestApi<T>(path: string, site: SiteContext, token: string, options: RequestOptions = {}) {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      "x-pangen-site": site,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || body?.ok === false) {
    const message = typeof body?.error === "string" ? body.error : body?.error?.message;
    throw new Error(message || "后台接口请求失败，请稍后重试");
  }

  return (body?.data ?? body) as T;
}

export function loginAdmin(account: string, password: string, site: Exclude<SiteContext, "all">) {
  return requestApi<IdentitySession>("/api/identity/login", site, "", {
    method: "POST",
    body: { account, password, site },
  });
}

export function getAdminSummary(site: SiteContext, token: string) {
  return requestApi<AdminSummary>("/api/admin/summary", site, token);
}

export function getReviewTasks(site: SiteContext, token: string) {
  return requestApi<{ items: ModerationTaskRecord[] }>("/api/moderation/tasks", site, token);
}

export function getReviewTask(site: SiteContext, token: string, id: string) {
  return requestApi<ModerationTaskRecord>(`/api/moderation/tasks/${id}`, site, token);
}

export function updateReviewTaskStatus(site: SiteContext, token: string, id: string, status: ModerationTaskRecord["status"]) {
  return requestApi<ModerationTaskRecord>(`/api/moderation/tasks/${id}/status`, site, token, {
    method: "PATCH",
    body: { status },
  });
}

export function getAuditLogs(site: SiteContext, token: string) {
  return requestApi<{ items: AuditLogRecord[] }>("/api/admin/audit-logs", site, token);
}

export function getSiteConfigs(site: SiteContext, token: string) {
  return requestApi<{ items: SiteConfigRecord[] }>("/api/admin/site-configs", site, token);
}

export function updateSiteConfig(site: SiteContext, token: string, id: string, body: UpdateSiteConfigRequest) {
  return requestApi<SiteConfigRecord>(`/api/admin/site-configs/${id}`, site, token, {
    method: "PATCH",
    body,
  });
}

export function getAdminUsers(site: SiteContext, token: string) {
  return requestApi<{ items: AdminUserRecord[] }>("/api/admin/users", site, token);
}

export function updateAdminUserRole(site: SiteContext, token: string, id: string, body: UpdateAdminUserRoleRequest) {
  return requestApi<AdminUserRecord>(`/api/admin/users/${id}/role`, site, token, {
    method: "PATCH",
    body,
  });
}

export function getAdminContent(site: SiteContext, token: string) {
  return requestApi<{ items: AdminContentRecord[] }>("/api/admin/content", site, token);
}

export function getCompassContent(site: SiteContext, token: string) {
  return requestApi<{ items: AdminContentRecord[] }>("/api/compass/admin/content", site, token);
}

export function getCompassContentDetail(site: SiteContext, token: string, id: string) {
  return requestApi<CompassContentDetail>(`/api/compass/admin/content/${id}`, site, token);
}

export function updateCompassContentStatus(site: SiteContext, token: string, id: string, status: string) {
  return requestApi<AdminContentRecord>(`/api/compass/admin/content/${id}/status`, site, token, {
    method: "PATCH",
    body: { status },
  });
}

export function getAnalyticsMetrics(site: SiteContext, token: string) {
  return requestApi<{ items: AnalyticsMetric[] }>("/api/analytics/metrics", site, token);
}

export function getAnalyticsEvents(site: SiteContext, token: string) {
  return requestApi<{ items: BehaviorEventRecord[] }>("/api/analytics/events", site, token);
}

export function getBillingOverview(site: SiteContext, token: string) {
  return requestApi<{ quotas: QuotaRecord[]; orders: PaymentOrderRecord[] }>("/api/billing/admin/overview", site, token);
}

export function confirmPaymentOrder(site: SiteContext, token: string, id: string) {
  return requestApi<{ order: PaymentOrderRecord; quota: QuotaRecord }>(`/api/billing/admin/orders/${id}/confirm`, site, token, {
    method: "POST",
  });
}

export interface EmailDeliveryRecord {
  id: string;
  to: string;
  subject: string;
  status: string;
  createdAt: string;
}

export function getEmailDeliveries(site: SiteContext, token: string) {
  return requestApi<{ deliveries: EmailDeliveryRecord[] }>("/api/notification/email-deliveries", site, token);
}

export interface DeletionRequest {
  id: string;
  userId: string;
  username: string;
  email: string | null;
  site: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
}

export function getDeletionRequests(site: SiteContext, token: string) {
  return requestApi<{ items: DeletionRequest[] }>("/api/compliance/account-deletions", site, token);
}

export function processDeletionRequest(site: SiteContext, token: string, id: string, action: "approve" | "reject") {
  return requestApi<{ success: boolean }>(`/api/compliance/account-deletions/${id}/process`, site, token, {
    method: "POST",
    body: { action },
  });
}

export interface FeatureFlag {
  id: string;
  site: string;
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
}

export function getFeatureFlags(site: SiteContext, token: string) {
  return requestApi<{ items: FeatureFlag[] }>(`/api/platform/feature-flags?site=${site}`, site, token);
}

export interface SearchGap {
  query: string;
  missedCount: number;
  lastMissedAt: string;
}

export function getSearchGaps(site: SiteContext, token: string) {
  return requestApi<{ items: SearchGap[] }>("/api/campus/search/gaps", site, token);
}

export interface AiCallLog {
  id: string;
  site: string;
  endpoint: string;
  mode: "ai" | "demo";
  fallbackReason: string | null;
  latency: number;
  createdAt: string;
}

export function getAiCallLogs(site: SiteContext, token: string) {
  return requestApi<{ items: AiCallLog[] }>("/api/ai-gateway/logs", site, token);
}

export interface CampusArticleDetail {
  id: string;
  title: string;
  content: string;
  status: string;
  authorId: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export function getCampusArticleDetail(site: SiteContext, token: string, id: string) {
  return requestApi<CampusArticleDetail>(`/api/campus/admin/articles/${id}`, site, token);
}

export interface ContentQualityReport {
  campus: {
    articleStatusDistribution: Record<string, number>;
    knowledgeBaseDistribution: Record<string, number>;
    averageHelpfulCount: number;
  };
  compass: {
    contentTypeDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    averageVersionCount: number;
  };
}

export function getContentQualityReport(site: SiteContext, token: string) {
  return requestApi<ContentQualityReport>("/api/admin/content-quality", site, token);
}
