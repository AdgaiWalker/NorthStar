import { useCallback, useMemo, useState, type ReactNode } from "react";
import { NavLink, Route, Routes, useParams } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AdminSummary, SiteContext } from "@ns/shared";
import { DataState } from "./components/DataState";
import { useApiResource } from "./components/useApiResource";
import {
  getAdminSummary,
  getAuditLogs,
  getReviewTask,
  getReviewTasks,
  getSiteConfigs,
  requestApi,
} from "./services/api";

const navItems = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/review", label: "审核队列", icon: ShieldCheck },
  { to: "/users", label: "用户管理", icon: Users },
  { to: "/content", label: "内容管理", icon: FileText },
  { to: "/audit", label: "审计日志", icon: ScrollText },
  { to: "/config", label: "系统配置", icon: Settings },
  { to: "/analytics", label: "数据中心", icon: BarChart3 },
  { to: "/billing", label: "支付管理", icon: CreditCard },
];

const siteOptions: SiteContext[] = ["cn", "com", "all"];

export default function App() {
  const [site, setSite] = useState<SiteContext>("cn");
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") ?? "");

  const saveToken = (value: string) => {
    setToken(value);
    localStorage.setItem("admin_token", value);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <ShieldCheck className="h-7 w-7 text-teal" aria-hidden="true" />
          <div>
            <div className="text-base font-semibold">盘根统一后台</div>
            <div className="text-xs text-neutral-500">admin-console</div>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neutral-600">当前站点</span>
              <div className="segmented">
                {siteOptions.map((item) => (
                  <button
                    key={item}
                    className={item === site ? "segmented-active" : "segmented-button"}
                    type="button"
                    onClick={() => setSite(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <label className="token-box">
              <KeyRound className="h-4 w-4 text-teal" aria-hidden="true" />
              <input
                value={token}
                onChange={(event) => saveToken(event.target.value)}
                placeholder="管理员 Token"
                type="password"
              />
            </label>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 md:px-6">
          <Routes>
            <Route path="/" element={<Dashboard site={site} token={token} />} />
            <Route path="/review" element={<ReviewQueue site={site} token={token} />} />
            <Route path="/review/:id" element={<ReviewDetail site={site} token={token} />} />
            <Route path="/users" element={<SummaryPage title="用户管理" site={site} token={token} pick="userCount" />} />
            <Route path="/content" element={<SummaryPage title="内容管理" site={site} token={token} pick="contentCount" />} />
            <Route path="/audit" element={<AuditPage site={site} token={token} />} />
            <Route path="/config" element={<ConfigPage site={site} token={token} />} />
            <Route path="/analytics" element={<HealthPage title="数据中心" path="/api/analytics/health" site={site} token={token} />} />
            <Route path="/billing" element={<HealthPage title="支付管理" path="/api/billing/health" site={site} token={token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Dashboard({ site, token }: PageProps) {
  const load = useCallback(() => getAdminSummary(site, token), [site, token]);
  const resource = useApiResource(load);

  return (
    <PageShell title="总览">
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无后台总览数据" onRetry={resource.refresh}>
        {resource.data && <SummaryGrid summary={resource.data} />}
      </DataState>
    </PageShell>
  );
}

function ReviewQueue({ site, token }: PageProps) {
  const load = useCallback(() => getReviewTasks(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  return (
    <PageShell title="审核队列">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无审核任务" onRetry={resource.refresh}>
        <div className="table-list">
          {items.map((item) => (
            <NavLink key={item.id} to={`/review/${item.id}`} className="table-row">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-neutral-500">{item.type} · {item.targetType}/{item.targetId}</div>
              </div>
              <span className="status-pill">{item.status}</span>
            </NavLink>
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}

function ReviewDetail({ site, token }: PageProps) {
  const { id = "" } = useParams();
  const load = useCallback(() => getReviewTask(site, token, id), [site, token, id]);
  const resource = useApiResource(load);

  return (
    <PageShell title="审核详情">
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="审核任务不存在" onRetry={resource.refresh}>
        {resource.data && (
          <section className="detail-panel">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{resource.data.title}</h2>
              <span className="status-pill">{resource.data.status}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>站点</dt><dd>{resource.data.site}</dd></div>
              <div><dt>类型</dt><dd>{resource.data.type}</dd></div>
              <div><dt>目标</dt><dd>{resource.data.targetType}/{resource.data.targetId}</dd></div>
              <div><dt>原因</dt><dd>{resource.data.reason || "暂无原因"}</dd></div>
            </dl>
          </section>
        )}
      </DataState>
    </PageShell>
  );
}

function SummaryPage({ title, site, token, pick }: PageProps & { title: string; pick: keyof Pick<AdminSummary, "userCount" | "contentCount"> }) {
  const load = useCallback(() => getAdminSummary(site, token), [site, token]);
  const resource = useApiResource(load);

  return (
    <PageShell title={title}>
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无统计数据" onRetry={resource.refresh}>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">{title}</div>
          <div className="mt-2 text-3xl font-semibold">{resource.data?.[pick] ?? 0}</div>
        </div>
      </DataState>
    </PageShell>
  );
}

function AuditPage({ site, token }: PageProps) {
  const load = useCallback(() => getAuditLogs(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  return (
    <PageShell title="审计日志">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无审计日志" onRetry={resource.refresh}>
        <div className="table-list">
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.action}</div>
                <div className="text-sm text-neutral-500">{item.targetType}/{item.targetId}</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}

function ConfigPage({ site, token }: PageProps) {
  const load = useCallback(() => getSiteConfigs(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  return (
    <PageShell title="系统配置">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无系统配置" onRetry={resource.refresh}>
        <div className="table-list">
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.key}</div>
                <div className="text-sm text-neutral-500">{item.site}</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.updatedAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}

function HealthPage({ title, path, site, token }: PageProps & { title: string; path: string }) {
  const load = useCallback(() => requestApi<{ module: string; ready: boolean }>(path, site, token), [path, site, token]);
  const resource = useApiResource(load);

  return (
    <PageShell title={title}>
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无模块状态" onRetry={resource.refresh}>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">{resource.data?.module}</div>
          <div className="mt-2 text-xl font-semibold">{resource.data?.ready ? "已接入真实接口" : "接口不可用"}</div>
        </div>
      </DataState>
    </PageShell>
  );
}

function SummaryGrid({ summary }: { summary: AdminSummary }) {
  const metrics = useMemo(
    () => [
      { label: "待审任务", value: summary.reviewPendingCount },
      { label: "审计日志", value: summary.auditLogCount },
      { label: "用户数量", value: summary.userCount },
      { label: "内容数量", value: summary.contentCount },
    ],
    [summary],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <div className="metric-card" key={item.label}>
          <div className="text-sm text-neutral-500">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="mb-5 text-2xl font-semibold tracking-normal">{title}</h1>
      {children}
    </section>
  );
}

interface PageProps {
  site: SiteContext;
  token: string;
}
