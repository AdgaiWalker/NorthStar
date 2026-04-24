import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { NavLink, Route, Routes, useParams } from "react-router-dom";
import {
  ArrowUpCircle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Play,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  IdentityUser,
  ModerationTaskRecord,
  PlatformRole,
  SiteConfigRecord,
  SiteContext,
} from "@ns/shared";
import { DataState } from "./components/DataState";
import { useApiResource } from "./components/useApiResource";
import {
  getAdminContent,
  getAdminSummary,
  getAdminUsers,
  getAuditLogs,
  getReviewTask,
  getReviewTasks,
  getSiteConfigs,
  loginAdmin,
  requestApi,
  updateAdminUserRole,
  updateReviewTaskStatus,
  updateSiteConfig,
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

const concreteSites: Array<Exclude<SiteContext, "all">> = ["cn", "com"];
const roles: Array<Exclude<PlatformRole, "visitor">> = ["user", "editor", "reviewer", "operator", "admin"];

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => readSession());
  const [site, setSite] = useState<SiteContext>(() => readSession()?.user.site ?? "cn");

  const saveSession = (nextSession: AdminSession) => {
    setSession(nextSession);
    setSite(nextSession.user.site);
    localStorage.setItem("admin_session", JSON.stringify(nextSession));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("admin_session");
  };

  if (!session) {
    return <LoginPage onLogin={saveSession} />;
  }

  const allowedSites: SiteContext[] = session.user.role === "admin" ? ["cn", "com", "all"] : [session.user.site];
  const effectiveSite = allowedSites.includes(site) ? site : session.user.site;

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
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neutral-600">当前站点</span>
              <div className="segmented">
                {allowedSites.map((item) => (
                  <button
                    key={item}
                    className={item === effectiveSite ? "segmented-active" : "segmented-button"}
                    type="button"
                    onClick={() => setSite(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="user-chip">
                <KeyRound className="h-4 w-4 text-teal" aria-hidden="true" />
                {session.user.name} · {session.user.role}
              </span>
              <button className="ghost-button" type="button" onClick={logout}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                退出
              </button>
            </div>
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
            <Route path="/" element={<Dashboard site={effectiveSite} token={session.token} />} />
            <Route path="/review" element={<ReviewQueue site={effectiveSite} token={session.token} />} />
            <Route path="/review/:id" element={<ReviewDetail site={effectiveSite} token={session.token} />} />
            <Route path="/users" element={<UsersPage site={effectiveSite} token={session.token} currentUser={session.user} />} />
            <Route path="/content" element={<ContentPage site={effectiveSite} token={session.token} />} />
            <Route path="/audit" element={<AuditPage site={effectiveSite} token={session.token} />} />
            <Route path="/config" element={<ConfigPage site={effectiveSite} token={session.token} />} />
            <Route path="/analytics" element={<HealthPage title="数据中心" path="/api/analytics/health" site={effectiveSite} token={session.token} />} />
            <Route path="/billing" element={<HealthPage title="支付管理" path="/api/billing/health" site={effectiveSite} token={session.token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [site, setSite] = useState<Exclude<SiteContext, "all">>("cn");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await loginAdmin(account, password, site);
      if (!isAdminRole(session.user.role)) {
        setError("当前账号没有后台访问权限");
        return;
      }
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-8 text-ink">
      <form className="login-panel" onSubmit={submit}>
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-teal" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">盘根统一后台</h1>
            <p className="mt-1 text-sm text-neutral-500">使用用户名或邮箱登录</p>
          </div>
        </div>

        <label className="field-label">
          站点
          <div className="segmented mt-2">
            {concreteSites.map((item) => (
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
        </label>

        <label className="field-label">
          用户名或邮箱
          <input className="text-input" value={account} onChange={(event) => setAccount(event.target.value)} />
        </label>

        <label className="field-label">
          密码
          <input className="text-input" value={password} type="password" onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error && <div className="error-line">{error}</div>}

        <button className="primary-button w-full" type="submit" disabled={loading}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {loading ? "正在登录" : "登录后台"}
        </button>
      </form>
    </main>
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
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const load = useCallback(() => getReviewTasks(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = useMemo(() => {
    const nextItems = resource.data?.items ?? [];
    return nextItems.filter((item) => (status === "all" || item.status === status) && (type === "all" || item.type === type));
  }, [resource.data?.items, status, type]);

  return (
    <PageShell title="审核队列">
      <div className="toolbar">
        <select className="select-input" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_review">处理中</option>
          <option value="escalated">已升级</option>
          <option value="resolved">已解决</option>
          <option value="dismissed">已驳回</option>
        </select>
        <select className="select-input" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">全部类型</option>
          <option value="report">举报</option>
          <option value="changed_feedback">有变化</option>
          <option value="ai_output_review">AI 抽检</option>
          <option value="application_review">申请审核</option>
          <option value="space_claim">空间认领</option>
        </select>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无审核任务" onRetry={resource.refresh}>
        <div className="table-list">
          {items.map((item) => (
            <NavLink key={item.id} to={`/review/${item.id}`} className="table-row">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-neutral-500">
                  {item.type} · {item.targetType}/{item.targetId}
                </div>
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
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(() => getReviewTask(site, token, id), [site, token, id]);
  const resource = useApiResource(load);

  const changeStatus = async (status: ModerationTaskRecord["status"]) => {
    setMessage(null);
    try {
      await updateReviewTaskStatus(site, token, id, status);
      setMessage("审核状态已更新");
      resource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "审核状态更新失败");
    }
  };

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
            <div className="action-row">
              {resource.data.status === "pending" && (
                <>
                  <button className="primary-button" type="button" onClick={() => changeStatus("in_review")}>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    开始处理
                  </button>
                  <button className="ghost-button" type="button" onClick={() => changeStatus("escalated")}>
                    <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                    升级
                  </button>
                </>
              )}
              {resource.data.status === "in_review" && (
                <>
                  <button className="primary-button" type="button" onClick={() => changeStatus("resolved")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    解决
                  </button>
                  <button className="danger-button" type="button" onClick={() => changeStatus("dismissed")}>
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    驳回
                  </button>
                </>
              )}
              {resource.data.status === "escalated" && (
                <button className="primary-button" type="button" onClick={() => changeStatus("resolved")}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  解决
                </button>
              )}
            </div>
            {message && <div className="mt-4 text-sm text-neutral-600">{message}</div>}
          </section>
        )}
      </DataState>
    </PageShell>
  );
}

function UsersPage({ site, token, currentUser }: PageProps & { currentUser: IdentityUser }) {
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(() => getAdminUsers(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  const changeRole = async (user: AdminUserRecord, role: Exclude<PlatformRole, "visitor">) => {
    setMessage(null);
    try {
      await updateAdminUserRole(site, token, user.id, { role });
      setMessage("用户角色已更新");
      resource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "用户角色更新失败");
    }
  };

  return (
    <PageShell title="用户管理">
      {message && <div className="notice-line">{message}</div>}
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无用户" onRetry={resource.refresh}>
        <div className="table-list">
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.name || item.username}</div>
                <div className="text-sm text-neutral-500">{item.username} · {item.email || "无邮箱"} · {item.site}</div>
              </div>
              <select
                className="select-input w-36"
                value={item.role}
                disabled={currentUser.role !== "admin"}
                onChange={(event) => changeRole(item, event.target.value as Exclude<PlatformRole, "visitor">)}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}

function ContentPage({ site, token }: PageProps) {
  const load = useCallback(() => getAdminContent(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  return (
    <PageShell title="内容管理">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无内容" onRetry={resource.refresh}>
        <div className="table-list">
          {items.map((item: AdminContentRecord) => (
            <div className="table-row" key={`${item.type}-${item.id}`}>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-neutral-500">{item.type} · {item.status} · 作者 {item.authorId}</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
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
        <div className="grid gap-4">
          {items.map((item) => (
            <ConfigEditor key={item.id} item={item} site={site} token={token} onSaved={resource.refresh} />
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}

function ConfigEditor({ item, site, token, onSaved }: PageProps & { item: SiteConfigRecord; onSaved: () => void }) {
  const [value, setValue] = useState(() => JSON.stringify(item.value, null, 2));
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setMessage(null);
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      await updateSiteConfig(site, token, item.id, { value: parsed });
      setMessage("配置已保存");
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "配置保存失败");
    }
  };

  return (
    <section className="detail-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{item.key}</h2>
          <p className="text-sm text-neutral-500">{item.site} · {new Date(item.updatedAt).toLocaleString("zh-CN")}</p>
        </div>
        <button className="primary-button" type="button" onClick={save}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          保存
        </button>
      </div>
      <textarea className="json-editor" value={value} onChange={(event) => setValue(event.target.value)} />
      {message && <div className="mt-3 text-sm text-neutral-600">{message}</div>}
    </section>
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

function readSession(): AdminSession | null {
  const raw = localStorage.getItem("admin_session");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AdminSession;
    return parsed?.token && isAdminRole(parsed.user?.role) ? parsed : null;
  } catch {
    return null;
  }
}

function isAdminRole(role: unknown): role is "reviewer" | "operator" | "admin" {
  return role === "reviewer" || role === "operator" || role === "admin";
}

interface PageProps {
  site: SiteContext;
  token: string;
}

interface AdminSession {
  token: string;
  user: IdentityUser;
}
