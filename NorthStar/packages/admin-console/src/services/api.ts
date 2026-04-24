import type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  AuditLogRecord,
  IdentitySession,
  ModerationTaskRecord,
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
