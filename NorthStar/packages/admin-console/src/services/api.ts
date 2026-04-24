import type {
  AdminSummary,
  AuditLogRecord,
  ModerationTaskRecord,
  SiteConfigRecord,
  SiteContext,
} from "@ns/shared";

interface ApiResponse<T> {
  ok?: boolean;
  data?: T;
  error?: string | { message?: string };
}

export async function requestApi<T>(path: string, site: SiteContext, token: string) {
  const response = await fetch(path, {
    headers: {
      "x-pangen-site": site,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || body?.ok === false) {
    const message = typeof body?.error === "string" ? body.error : body?.error?.message;
    throw new Error(message || "后台接口请求失败，请稍后重试");
  }

  return (body?.data ?? body) as T;
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

export function getAuditLogs(site: SiteContext, token: string) {
  return requestApi<{ items: AuditLogRecord[] }>("/api/admin/audit-logs", site, token);
}

export function getSiteConfigs(site: SiteContext, token: string) {
  return requestApi<{ items: SiteConfigRecord[] }>("/api/admin/site-configs", site, token);
}
