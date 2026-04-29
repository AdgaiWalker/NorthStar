import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { NavLink, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpCircle,
  Ban,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
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
  Trash2,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  AnalyticsMetric,
  BehaviorEventRecord,
  IdentityUser,
  ModerationTaskRecord,
  PaymentOrderRecord,
  PlatformRole,
  QuotaRecord,
  SiteConfigRecord,
  SiteContext,
} from "@ns/shared";
import { DataState } from "./components/DataState";
import { useApiResource } from "./components/useApiResource";
import {
  getAdminContent,
  getAdminSummary,
  getAdminUsers,
  getAnalyticsEvents,
  getAnalyticsMetrics,
  getAuditLogs,
  getBillingOverview,
  getCompassContent,
  getCompassContentDetail,
  updateCompassContentStatus,
  confirmPaymentOrder,
  getEmailDeliveries,
  getReviewTask,
  getReviewTasks,
  getSiteConfigs,
  loginAdmin,
  updateAdminUserRole,
  updateReviewTaskStatus,
  updateSiteConfig,
  getDeletionRequests,
  processDeletionRequest,
  getFeatureFlags,
  getSearchGaps,
  getAiCallLogs,
  getCampusArticleDetail,
  getContentQualityReport,
} from "./services/api";
import type { EmailDeliveryRecord, DeletionRequest, FeatureFlag, SearchGap, AiCallLog, CampusArticleDetail, ContentQualityReport } from "./services/api";

const navItems = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/review", label: "审核队列", icon: ShieldCheck },
  { to: "/users", label: "用户管理", icon: Users },
  { to: "/content", label: "内容管理", icon: FileText },
  { to: "/compliance", label: "合规处理", icon: UserX },
  { to: "/audit", label: "审计日志", icon: ScrollText },
  { to: "/deliveries", label: "通知投递", icon: Bell },
  { to: "/flags", label: "功能开关", icon: Settings },
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
            <Route path="/content/:id" element={<ContentDetailPage site={effectiveSite} token={session.token} />} />
            <Route path="/compliance" element={<CompliancePage site={effectiveSite} token={session.token} />} />
            <Route path="/flags" element={<FlagsPage site={effectiveSite} token={session.token} />} />
            <Route path="/audit" element={<AuditPage site={effectiveSite} token={session.token} />} />
            <Route path="/deliveries" element={<DeliveryPage site={effectiveSite} token={session.token} />} />
            <Route path="/config" element={<ConfigPage site={effectiveSite} token={session.token} />} />
            <Route path="/analytics" element={<AnalyticsPage site={effectiveSite} token={session.token} />} />
            <Route path="/billing" element={<BillingPage site={effectiveSite} token={session.token} />} />
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
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getReviewTasks(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = useMemo(() => {
    const nextItems = resource.data?.items ?? [];
    return nextItems.filter((item) => (status === "all" || item.status === status) && (type === "all" || item.type === type));
  }, [resource.data?.items, status, type]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="审核队列">
      <div className="toolbar">
        <select className="select-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_review">处理中</option>
          <option value="escalated">已升级</option>
          <option value="resolved">已解决</option>
          <option value="dismissed">已驳回</option>
        </select>
        <select className="select-input" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
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
          {paged.map((item) => (
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
        <Pagination page={currentPage} total={items.length} pageSize={pageSize} onChange={setPage} />
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
            <TaskPayload task={resource.data} />
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

function TaskPayload({ task }: { task: ModerationTaskRecord }) {
  const entries = task.type === "space_claim" ? spaceClaimPayloadEntries(task.payload) : genericPayloadEntries(task.payload);
  if (!entries.length) return null;

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">任务载荷</h3>
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt className="text-neutral-500">{entry.label}</dt>
            <dd className="mt-1 break-words font-medium text-ink">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function spaceClaimPayloadEntries(payload: Record<string, unknown>) {
  return [
    { label: "空间 ID", value: stringValue(payload.spaceId) },
    { label: "空间标识", value: stringValue(payload.spaceSlug) },
    { label: "当前维护者", value: stringValue(payload.currentOwnerId) },
    { label: "候选维护者", value: stringValue(payload.candidateUserId) },
    { label: "最后活跃时间", value: formatPayloadDate(payload.lastActiveAt) },
  ].filter((entry) => entry.value !== "未提供");
}

function genericPayloadEntries(payload: Record<string, unknown>) {
  return Object.entries(payload).map(([key, value]) => ({
    label: key,
    value: formatPayloadValue(value),
  }));
}

function stringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return "未提供";
}

function formatPayloadDate(value: unknown) {
  const raw = stringValue(value);
  if (raw === "未提供") return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("zh-CN");
}

function formatPayloadValue(value: unknown) {
  if (value === null || value === undefined) return "未提供";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-1 pt-4 text-sm text-neutral-500">
      <span>第 {start} - {end} 条，共 {total} 条</span>
      <div className="flex gap-2">
        <button className="ghost-button" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> 上一页
        </button>
        <button className="ghost-button" type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          下一页 <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function UsersPage({ site, token, currentUser }: PageProps & { currentUser: IdentityUser }) {
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getAdminUsers(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          {paged.map((item) => (
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
        <Pagination page={currentPage} total={items.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}

type ContentSource = "campus" | "compass";

interface ContentItem extends AdminContentRecord {
  _source: ContentSource;
}

function ContentPage({ site, token }: PageProps) {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(() => getAdminContent(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  const compassLoad = useCallback(() => getCompassContent(site, token), [site, token]);
  const compassResource = useApiResource(compassLoad);
  const compassItems = compassResource.data?.items ?? [];

  const allItems: ContentItem[] = useMemo(() => [
    ...items.map((item: AdminContentRecord) => ({ ...item, _source: "campus" as ContentSource })),
    ...compassItems.map((item: AdminContentRecord) => ({ ...item, _source: "compass" as ContentSource })),
  ], [items, compassItems]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      return true;
    });
  }, [allItems, filterType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="内容管理">
      <div className="toolbar">
        <select className="select-input" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
          <option value="all">全部类型</option>
          <option value="tool">工具</option>
          <option value="topic">专题</option>
          <option value="article">文章</option>
          <option value="news">资讯</option>
        </select>
        <select className="select-input" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="pending">待审核</option>
          <option value="rejected">已驳回</option>
          <option value="archived">已归档</option>
        </select>
      </div>
      <DataState loading={resource.loading || compassResource.loading} error={resource.error || compassResource.error} empty={filtered.length === 0} emptyText="暂无内容" onRetry={() => { resource.refresh(); compassResource.refresh(); }}>
        <div className="table-list">
          {paged.map((item) => (
            <NavLink key={`${item._source}-${item.id}`} to={`/content/${item.id}?source=${item._source}`} className="table-row">
              <div>
                <div className="font-medium">
                  <span className={`mr-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${item._source === "campus" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {item._source === "campus" ? "校园" : "全球"}
                  </span>
                  {item.title}
                </div>
                <div className="text-sm text-neutral-500">{item.type} · {item.status} · 作者 {item.authorId}</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
            </NavLink>
          ))}
        </div>
        {totalPages > 1 && <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage} />}
      </DataState>
    </PageShell>
  );
}

function CompliancePage({ site, token }: PageProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getDeletionRequests(site, token), [site, token]);
  const resource = useApiResource(load);
  const items: DeletionRequest[] = resource.data?.items ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const processRequest = async (id: string, action: "approve" | "reject") => {
    try {
      await processDeletionRequest(site, token, id, action);
      resource.refresh();
    } catch (err) {
      console.error("处理注销申请失败:", err);
    }
  };

  return (
    <PageShell title="合规处理 - 注销申请">
      <div className="toolbar">
        <select className="select-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="approved">已批准</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={filtered.length === 0} emptyText="暂无注销申请" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.username}</div>
                <div className="text-sm text-neutral-500">
                  {item.email || "无邮箱"} · {item.site}
                  <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    item.status === "pending" ? "bg-amber-50 text-amber-700" :
                    item.status === "approved" ? "bg-green-50 text-green-700" :
                    "bg-rose-50 text-rose-700"
                  }`}>
                    {item.status === "pending" ? "待处理" : item.status === "approved" ? "已批准" : "已驳回"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">{new Date(item.requestedAt).toLocaleString("zh-CN")}</span>
                {item.status === "pending" && (
                  <div className="flex gap-1">
                    <button className="ghost-button" type="button" onClick={() => void processRequest(item.id, "approve")}>
                      <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                      批准
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void processRequest(item.id, "reject")}>
                      <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                      驳回
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}

function FlagsPage({ site, token }: PageProps) {
  const cnLoad = useCallback(() => getFeatureFlags("cn", token), [token]);
  const cnResource = useApiResource(cnLoad);
  const cnFlags: FeatureFlag[] = cnResource.data?.items ?? [];

  const comLoad = useCallback(() => getFeatureFlags("com", token), [token]);
  const comResource = useApiResource(comLoad);
  const comFlags: FeatureFlag[] = comResource.data?.items ?? [];

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      await updateSiteConfig(site, token, flag.id, { value: { enabled: !flag.enabled } });
      cnResource.refresh();
      comResource.refresh();
    } catch (err) {
      console.error("切换功能开关失败:", err);
    }
  };

  const FlagRow = ({ flag }: { flag: FeatureFlag }) => (
    <div className="table-row" key={flag.id}>
      <div>
        <div className="font-medium">{flag.key}</div>
        <div className="text-sm text-neutral-500">{flag.description || "无描述"}</div>
      </div>
      <button
        className={`w-12 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          flag.enabled ? "bg-teal text-white" : "bg-neutral-200 text-neutral-600"
        }`}
        type="button"
        onClick={() => void toggleFlag(flag)}
      >
        {flag.enabled ? "ON" : "OFF"}
      </button>
    </div>
  );

  return (
    <PageShell title="功能开关">
      <div className="grid gap-6 xl:grid-cols-2">
        <DataState loading={cnResource.loading} error={cnResource.error} empty={cnFlags.length === 0} emptyText="暂无功能开关" onRetry={cnResource.refresh}>
          <section className="detail-panel">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-semibold">校园站</h2>
              <span className="text-sm text-neutral-500">{cnFlags.length} 个开关</span>
            </div>
            <div className="table-list">
              {cnFlags.map((flag) => <FlagRow key={flag.id} flag={flag} />)}
            </div>
          </section>
        </DataState>

        <DataState loading={comResource.loading} error={comResource.error} empty={comFlags.length === 0} emptyText="暂无功能开关" onRetry={comResource.refresh}>
          <section className="detail-panel">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-semibold">全球站</h2>
              <span className="text-sm text-neutral-500">{comFlags.length} 个开关</span>
            </div>
            <div className="table-list">
              {comFlags.map((flag) => <FlagRow key={flag.id} flag={flag} />)}
            </div>
          </section>
        </DataState>
      </div>
    </PageShell>
  );
}

function ContentDetailPage({ site, token }: PageProps) {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as ContentSource | null;
  const [message, setMessage] = useState<string | null>(null);

  const compassLoad = useCallback(async () => {
    if (source === "compass") {
      return getCompassContentDetail(site, token, id);
    }
    return null;
  }, [site, token, id, source]);
  const compassResource = useApiResource(compassLoad);

  const campusLoad = useCallback(async () => {
    if (source === "campus") {
      return getCampusArticleDetail(site, token, id);
    }
    return null;
  }, [site, token, id, source]);
  const campusResource = useApiResource(campusLoad);

  const isCompass = source === "compass";
  const isCampus = source === "campus";
  const compassDetail = compassResource.data;
  const campusDetail = campusResource.data;
  const detail = isCompass ? compassDetail : campusDetail;
  const resource = isCompass ? compassResource : campusResource;

  const changeStatus = async (newStatus: string) => {
    setMessage(null);
    try {
      await updateCompassContentStatus(site, token, id, newStatus);
      setMessage("内容状态已更新");
      compassResource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "状态更新失败");
    }
  };

  const compassRecord = compassDetail?.record;
  const metaEntries = compassRecord?.metadata ? Object.entries(compassRecord.metadata) : [];

  return (
    <PageShell title="内容详情">
      <NavLink to="/content" className="ghost-button mb-4 inline-flex items-center gap-1">
        <ArrowUpCircle className="h-4 w-4 rotate-180" aria-hidden="true" />
        返回内容列表
      </NavLink>

      {!isCompass && !isCampus && (
        <section className="detail-panel">
          <p className="text-sm text-neutral-500">内容详情暂不支持查看。</p>
        </section>
      )}

      {isCompass && (
        <DataState loading={compassResource.loading} error={compassResource.error} empty={!compassDetail} emptyText="内容不存在" onRetry={compassResource.refresh}>
          {compassDetail && compassRecord && (
            <section className="detail-panel">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{compassRecord.title}</h2>
                <span className={`status-pill ${compassRecord.status === "published" ? "text-green-700 bg-green-50" : compassRecord.status === "rejected" ? "text-rose-700 bg-rose-50" : "text-amber-700 bg-amber-50"}`}>{compassRecord.status}</span>
              </div>
              <dl className="detail-grid mt-4">
                <div><dt>来源</dt><dd>全球站</dd></div>
                <div><dt>类型</dt><dd>{compassRecord.contentType}</dd></div>
                <div><dt>Slug</dt><dd>{compassRecord.slug}</dd></div>
                <div><dt>领域</dt><dd>{compassRecord.domain || "无"}</dd></div>
                <div><dt>作者</dt><dd>{compassRecord.ownerId || "未知"}</dd></div>
                <div><dt>创建时间</dt><dd>{compassRecord.createdAt ? new Date(compassRecord.createdAt).toLocaleString("zh-CN") : "未知"}</dd></div>
                <div><dt>更新时间</dt><dd>{compassRecord.updatedAt ? new Date(compassRecord.updatedAt).toLocaleString("zh-CN") : "未知"}</dd></div>
              </dl>

              {compassRecord.summary && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-1">摘要</h3>
                  <p className="text-sm text-neutral-600">{compassRecord.summary}</p>
                </div>
              )}

              {compassRecord.body && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-1">正文</h3>
                  <div className="whitespace-pre-wrap text-sm text-neutral-600 max-h-64 overflow-y-auto rounded-lg bg-neutral-50 p-3">{compassRecord.body}</div>
                </div>
              )}

              {metaEntries.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">元数据</h3>
                  <dl className="grid gap-2 text-sm md:grid-cols-2">
                    {metaEntries.map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-neutral-500">{key}</dt>
                        <dd className="mt-0.5 break-words font-medium">{formatPayloadValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {compassDetail && compassDetail.versions.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">版本历史</h3>
                  <div className="table-list">
                    {compassDetail.versions.map((v) => (
                      <div className="table-row" key={v.id}>
                        <div>
                          <div className="font-medium">版本 {v.version}</div>
                          <div className="text-sm text-neutral-500">编辑者 {v.editorId ?? "系统"} · ID: {v.id}</div>
                        </div>
                        <span className="text-sm text-neutral-500">{new Date(v.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="action-row mt-6">
                {(compassRecord.status === "pending" || compassRecord.status === "draft") && (
                  <button className="primary-button" type="button" onClick={() => changeStatus("published")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    发布
                  </button>
                )}
                {compassRecord.status === "pending" && (
                  <button className="danger-button" type="button" onClick={() => changeStatus("rejected")}>
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    驳回
                  </button>
                )}
                {compassRecord.status === "published" && (
                  <button className="ghost-button" type="button" onClick={() => changeStatus("archived")}>
                    归档
                  </button>
                )}
                {compassRecord.status === "rejected" && (
                  <button className="primary-button" type="button" onClick={() => changeStatus("published")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    重新发布
                  </button>
                )}
              </div>
              {message && <div className="mt-4 text-sm text-neutral-600">{message}</div>}
            </section>
          )}
        </DataState>
      )}

      {isCampus && (
        <DataState loading={campusResource.loading} error={campusResource.error} empty={!campusDetail} emptyText="内容不存在" onRetry={campusResource.refresh}>
          {campusDetail && (
            <section className="detail-panel">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{campusDetail.title}</h2>
                <span className={`status-pill ${
                  campusDetail.status === "published" ? "text-green-700 bg-green-50" :
                  campusDetail.status === "draft" ? "text-amber-700 bg-amber-50" :
                  "text-neutral-700 bg-neutral-50"
                }`}>{campusDetail.status}</span>
              </div>
              <dl className="detail-grid mt-4">
                <div><dt>来源</dt><dd>校园站</dd></div>
                <div><dt>作者</dt><dd>{campusDetail.authorId}</dd></div>
                <div><dt>帮助数</dt><dd>{campusDetail.helpfulCount}</dd></div>
                <div><dt>状态</dt><dd>{campusDetail.status}</dd></div>
                <div><dt>创建时间</dt><dd>{new Date(campusDetail.createdAt).toLocaleString("zh-CN")}</dd></div>
                <div><dt>更新时间</dt><dd>{new Date(campusDetail.updatedAt).toLocaleString("zh-CN")}</dd></div>
              </dl>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-1">正文</h3>
                <div className="whitespace-pre-wrap text-sm text-neutral-600 max-h-96 overflow-y-auto rounded-lg bg-neutral-50 p-3">{campusDetail.content}</div>
              </div>
            </section>
          )}
        </DataState>
      )}
    </PageShell>
  );
}

function AuditPage({ site, token }: PageProps) {
  const [filterAction, setFilterAction] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getAuditLogs(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  const actionTypes = useMemo(() => [...new Set(items.map((item) => item.action))], [items]);

  const filtered = useMemo(() => {
    if (filterAction === "all") return items;
    return items.filter((item) => item.action === filterAction);
  }, [items, filterAction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="审计日志">
      <div className="toolbar">
        <select className="select-input" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
          <option value="all">全部操作</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={filtered.length === 0} emptyText="暂无审计日志" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div key={item.id}>
              <button
                type="button"
                className="table-row w-full cursor-pointer text-left"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div>
                  <div className="font-medium">{item.action}</div>
                  <div className="text-sm text-neutral-500">
                    {item.targetType}/{item.targetId}
                    {item.actorId && <span className="ml-2">操作者 {item.actorId}</span>}
                  </div>
                </div>
                <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
              </button>
              {expandedId === item.id && (
                <div className="border-b border-line bg-neutral-50 px-4 py-3 text-sm">
                  {(!item.before && !item.after) && (
                    <div className="text-neutral-500">无变更记录</div>
                  )}
                  {item.before && (
                    <div className="mb-2">
                      <div className="mb-1 font-medium text-neutral-700">变更前</div>
                      <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-neutral-600">{JSON.stringify(item.before, null, 2)}</pre>
                    </div>
                  )}
                  {item.after && (
                    <div>
                      <div className="mb-1 font-medium text-neutral-700">变更后</div>
                      <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-neutral-600">{JSON.stringify(item.after, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}

function DeliveryPage({ site, token }: PageProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getEmailDeliveries(site, token), [site, token]);
  const resource = useApiResource(load);
  const items: EmailDeliveryRecord[] = resource.data?.deliveries ?? [];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="通知投递">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无投递记录" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.subject}</div>
                <div className="text-sm text-neutral-500">
                  {item.to}
                  <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${item.status === "sent" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {item.status === "sent" ? "已发送" : item.status}
                  </span>
                </div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={items.length} pageSize={pageSize} onChange={setPage} />
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

function AnalyticsPage({ site, token }: PageProps) {
  const [activeTab, setActiveTab] = useState<"metrics" | "events" | "insights" | "ai-cost" | "quality">("metrics");
  const [eventPage, setEventPage] = useState(1);
  const eventPageSize = 20;
  const load = useCallback(
    async () => {
      const [metrics, events] = await Promise.all([getAnalyticsMetrics(site, token), getAnalyticsEvents(site, token)]);
      return { metrics: metrics.items, events: events.items };
    },
    [site, token],
  );
  const resource = useApiResource(load);
  const metrics = resource.data?.metrics ?? [];
  const events = resource.data?.events ?? [];

  const totalPages = Math.max(1, Math.ceil(events.length / eventPageSize));
  const currentPage = Math.min(eventPage, totalPages);
  const pagedEvents = events.slice((currentPage - 1) * eventPageSize, currentPage * eventPageSize);

  return (
    <PageShell title="数据中心">
      <div className="mb-4 flex gap-2 border-b border-line">
        <button className={`tab-button ${activeTab === "metrics" ? "active" : ""}`} type="button" onClick={() => setActiveTab("metrics")}>
          指标
        </button>
        <button className={`tab-button ${activeTab === "events" ? "active" : ""}`} type="button" onClick={() => setActiveTab("events")}>
          事件
        </button>
        <button className={`tab-button ${activeTab === "insights" ? "active" : ""}`} type="button" onClick={() => setActiveTab("insights")}>
          洞察
        </button>
        <button className={`tab-button ${activeTab === "ai-cost" ? "active" : ""}`} type="button" onClick={() => setActiveTab("ai-cost")}>
          AI 成本
        </button>
        <button className={`tab-button ${activeTab === "quality" ? "active" : ""}`} type="button" onClick={() => setActiveTab("quality")}>
          质量报告
        </button>
      </div>

      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无数据指标" onRetry={resource.refresh}>
        {activeTab === "metrics" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.length === 0 ? (
              <div className="metric-card">
                <div className="text-sm text-neutral-500">行为事件</div>
                <div className="mt-2 text-xl font-semibold">暂无聚合指标</div>
              </div>
            ) : (
              metrics.map((metric) => <AnalyticsMetricCard key={metric.key} metric={metric} />)
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="detail-panel">
            <h2 className="mb-3 font-semibold">最近行为事件</h2>
            {events.length === 0 ? (
              <div className="text-sm text-neutral-500">暂无行为事件</div>
            ) : (
              <>
                <div className="table-list">
                  {pagedEvents.map((event) => (
                    <div className="table-row" key={event.id}>
                      <div>
                        <div className="font-medium">{event.event}</div>
                        <div className="text-sm text-neutral-500">
                          {event.site} · 用户 {event.userId ?? "匿名"} · {formatMetadata(event.metadata)}
                        </div>
                      </div>
                      <span className="text-sm text-neutral-500">{new Date(event.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage} total={events.length} pageSize={eventPageSize} onChange={setEventPage} />
              </>
            )}
          </div>
        )}

        {activeTab === "insights" && <InsightsTab site={site} token={token} />}
        {activeTab === "ai-cost" && <AiCostTab site={site} token={token} />}
        {activeTab === "quality" && <QualityReportTab site={site} token={token} />}
      </DataState>
    </PageShell>
  );
}

function InsightsTab({ site, token }: PageProps) {
  const load = useCallback(() => getSearchGaps(site, token), [site, token]);
  const resource = useApiResource(load);
  const gaps: SearchGap[] = resource.data?.items ?? [];

  return (
    <div className="detail-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">搜索缺口排名</h2>
        <span className="text-sm text-neutral-500">{gaps.length} 条记录</span>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={gaps.length === 0} emptyText="暂无搜索缺口数据" onRetry={resource.refresh}>
        <div className="table-list">
          {gaps.map((gap, index) => (
            <div className="table-row" key={gap.query}>
              <div>
                <div className="font-medium">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                    {index + 1}
                  </span>
                  {gap.query}
                </div>
                <div className="text-sm text-neutral-500">未命中 {gap.missedCount} 次</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(gap.lastMissedAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </DataState>
    </div>
  );
}

function AiCostTab({ site, token }: PageProps) {
  const load = useCallback(() => getAiCallLogs(site, token), [site, token]);
  const resource = useApiResource(load);
  const logs: AiCallLog[] = resource.data?.items ?? [];

  const stats = useMemo(() => {
    const bySite = { cn: 0, com: 0 };
    const byMode = { ai: 0, demo: 0 };
    const byFallback: Record<string, number> = {};
    let totalLatency = 0;

    logs.forEach((log) => {
      bySite[log.site as keyof typeof bySite]++;
      byMode[log.mode]++;
      if (log.fallbackReason) {
        byFallback[log.fallbackReason] = (byFallback[log.fallbackReason] || 0) + 1;
      }
      totalLatency += log.latency;
    });

    return { bySite, byMode, byFallback, avgLatency: logs.length ? totalLatency / logs.length : 0 };
  }, [logs]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="grid gap-3">
        <div className="metric-card">
          <div className="text-sm text-neutral-500">总调用次数</div>
          <div className="mt-2 text-3xl font-semibold">{logs.length}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">校园站</div>
          <div className="mt-2 text-2xl font-semibold">{stats.bySite.cn}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">全球站</div>
          <div className="mt-2 text-2xl font-semibold">{stats.bySite.com}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">AI 模式</div>
          <div className="mt-2 text-2xl font-semibold">{stats.byMode.ai}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">Demo 模式</div>
          <div className="mt-2 text-2xl font-semibold">{stats.byMode.demo}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">平均延迟</div>
          <div className="mt-2 text-2xl font-semibold">{stats.avgLatency.toFixed(0)} ms</div>
        </div>
      </div>

      <div className="detail-panel">
        <h2 className="mb-3 font-semibold">Fallback 原因分布</h2>
        {Object.keys(stats.byFallback).length === 0 ? (
          <div className="text-sm text-neutral-500">无 fallback 记录</div>
        ) : (
          <div className="table-list">
            {Object.entries(stats.byFallback).map(([reason, count]) => (
              <div className="table-row" key={reason}>
                <div className="font-medium">{reason || "未知原因"}</div>
                <span className="text-sm font-semibold">{count} 次</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QualityReportTab({ site, token }: PageProps) {
  const load = useCallback(() => getContentQualityReport(site, token), [site, token]);
  const resource = useApiResource(load);
  const report = resource.data;

  return (
    <DataState loading={resource.loading} error={resource.error} empty={!report} emptyText="暂无质量报告数据" onRetry={resource.refresh}>
      {report && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="detail-panel">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-semibold">校园站质量报告</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">cn</span>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">文章状态分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.campus.articleStatusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">知识库分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.campus.knowledgeBaseDistribution).map(([kb, count]) => (
                  <div key={kb} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{kb}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="metric-card">
              <div className="text-sm text-neutral-500">平均帮助数</div>
              <div className="mt-2 text-2xl font-semibold">{report.campus.averageHelpfulCount.toFixed(1)}</div>
            </div>
          </section>

          <section className="detail-panel">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-semibold">全球站质量报告</h2>
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">com</span>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">内容类型分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.compass.contentTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">状态分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.compass.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="metric-card">
              <div className="text-sm text-neutral-500">平均版本数</div>
              <div className="mt-2 text-2xl font-semibold">{report.compass.averageVersionCount.toFixed(1)}</div>
            </div>
          </section>
        </div>
      )}
    </DataState>
  );
}

function BillingPage({ site, token }: PageProps) {
  const load = useCallback(() => getBillingOverview(site, token), [site, token]);
  const resource = useApiResource(load);
  const quotas = resource.data?.quotas ?? [];
  const orders = resource.data?.orders ?? [];
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmOrder = async (orderId: string) => {
    setProcessingOrderId(orderId);
    setActionError(null);
    try {
      await confirmPaymentOrder(site, token, orderId);
      await resource.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "订单确认失败，请稍后重试");
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <PageShell title="支付管理">
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无额度与订单数据" onRetry={resource.refresh}>
        {actionError && <div className="error-line mb-4">{actionError}</div>}
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="detail-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">AI 额度</h2>
              <span className="text-sm text-neutral-500">{quotas.length} 条</span>
            </div>
            {quotas.length === 0 ? (
              <div className="text-sm text-neutral-500">暂无额度记录</div>
            ) : (
              <div className="table-list">
                {quotas.map((quota) => <QuotaRow key={quota.id} quota={quota} />)}
              </div>
            )}
          </section>

          <section className="detail-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">手动支付订单</h2>
              <span className="text-sm text-neutral-500">{orders.length} 条</span>
            </div>
            {orders.length === 0 ? (
              <div className="text-sm text-neutral-500">暂无订单</div>
            ) : (
              <div className="table-list">
                {orders.map((order) => (
                  <PaymentOrderRow
                    key={order.id}
                    order={order}
                    confirming={processingOrderId === order.id}
                    onConfirm={() => void confirmOrder(order.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </DataState>
    </PageShell>
  );
}

function AnalyticsMetricCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <div className="metric-card">
      <div className="text-sm text-neutral-500">{metric.label}</div>
      <div className="mt-2 text-3xl font-semibold">
        {metric.value}
        {metric.unit && <span className="ml-1 text-sm font-medium text-neutral-500">{metric.unit}</span>}
      </div>
      <div className="mt-1 text-xs text-neutral-400">{metric.site}</div>
    </div>
  );
}

function QuotaRow({ quota }: { quota: QuotaRecord }) {
  return (
    <div className="table-row">
      <div>
        <div className="font-medium">用户 {quota.userId}</div>
        <div className="text-sm text-neutral-500">{quota.site} · 更新于 {new Date(quota.updatedAt).toLocaleString("zh-CN")}</div>
      </div>
      <span className="text-sm font-semibold text-teal">{quota.aiCreditsRemaining} 点</span>
    </div>
  );
}

function PaymentOrderRow({
  order,
  confirming,
  onConfirm,
}: {
  order: PaymentOrderRecord;
  confirming: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="table-row">
      <div>
        <div className="font-medium">订单 {order.id} · {order.status}</div>
        <div className="text-sm text-neutral-500">
          用户 {order.userId} · {order.site} · {order.provider} · {order.credits} 点
        </div>
      </div>
      <span className="text-sm text-neutral-500">
        {(order.amountCents / 100).toFixed(2)} {order.currency}
      </span>
      {order.status === "pending" && (
        <button className="ghost-button" type="button" onClick={onConfirm} disabled={confirming}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {confirming ? "确认中" : "确认支付"}
        </button>
      )}
    </div>
  );
}

function formatMetadata(metadata: BehaviorEventRecord["metadata"]) {
  const keys = Object.keys(metadata);
  if (!keys.length) return "无元数据";
  return keys
    .slice(0, 3)
    .map((key) => `${key}: ${String(metadata[key])}`)
    .join("，");
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
