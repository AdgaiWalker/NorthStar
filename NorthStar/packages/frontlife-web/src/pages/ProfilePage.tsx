import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Bell, Bookmark, Download, FileText, LoaderCircle, Settings, ShieldCheck, Trash2, X } from 'lucide-react';
import type { AccountDeletionRequestRecord, DataExportResponse, ProfileResponse } from '@ns/shared';
import { ErrorState, LoadingState } from '@/components/LoadingState';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const permissions = useUserStore((state) => state.permissions);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const notifications = useUIStore((state) => state.notifications);
  const setNotifications = useUIStore((state) => state.setNotifications);
  const markNotificationRead = useUIStore((state) => state.markNotificationRead);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [exportResult, setExportResult] = useState<DataExportResponse | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionRequest, setDeletionRequest] = useState<AccountDeletionRequestRecord | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [certStatus, setCertStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certSchoolId, setCertSchoolId] = useState('');
  const [certSchoolName, setCertSchoolName] = useState('');
  const [certSubmitting, setCertSubmitting] = useState(false);
  const [certError, setCertError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setNotificationError('');
    Promise.all([api.getProfile(), api.getNotifications(), api.getCertificationStatus()])
      .then(([profileResult, notificationResult, certResult]) => {
        setProfile(profileResult);
        setNotifications(notificationResult.notifications);
        if (certResult.certification) {
          setCertStatus(certResult.certification.status);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '个人页加载失败'))
      .finally(() => setLoading(false));
  }, [reloadKey, setNotifications, token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-10">
        <div className="rounded-2xl border border-border-light bg-surface p-7 text-center">
          <h1 className="font-display text-[24px] font-bold text-ink">登录后查看我的盘根</h1>
          <p className="mt-2 text-sm text-ink-muted">登录后可以查看通知、收藏、贡献数据和个人内容。</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="mx-auto max-w-[640px] px-4 py-6">
        <LoadingState label="正在加载个人页..." />
      </div>
    );
  if (error || !profile) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-6">
        <ErrorState title="个人页加载失败" message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      </div>
    );
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const visibleNotifications = notifications.slice(0, 12);
  const nextAbility = getNextAbility(permissions.canWrite, permissions.canCreateSpace);

  const exportData = async () => {
    setExportLoading(true);
    setExportError('');

    try {
      setExportResult(await api.exportUserData());
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '数据导出失败，请稍后重试。');
    } finally {
      setExportLoading(false);
    }
  };

  const requestDeletion = async () => {
    setDeletionLoading(true);
    setDeletionError('');

    try {
      const result = await api.requestAccountDeletion({
        reason: deletionReason,
      });
      setDeletionRequest(result);
      setDeletionReason('');
    } catch (err) {
      setDeletionError(err instanceof Error ? err.message : '注销申请提交失败，请稍后重试。');
    } finally {
      setDeletionLoading(false);
    }
  };

  const submitCertApplication = async () => {
    if (!certSchoolId.trim() || !certSchoolName.trim()) {
      setCertError('请填写完整的学校信息');
      return;
    }
    setCertError('');
    setCertSubmitting(true);
    try {
      await api.applyCertification({
        schoolId: certSchoolId.trim(),
        schoolName: certSchoolName.trim(),
      });
      setCertStatus('pending');
      setCertDialogOpen(false);
      setCertSchoolId('');
      setCertSchoolName('');
    } catch (err) {
      setCertError(err instanceof Error ? err.message : '认证申请提交失败，请稍后重试。');
    } finally {
      setCertSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6">
      <div className="mb-4 rounded-2xl border border-border-light bg-surface p-4 md:hidden">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Bell size={16} className="text-sage" />
            通知
          </span>
          <span className="text-xs text-ink-muted">{unreadCount} 条未读</span>
        </div>
      </div>

      <section className="rounded-2xl border border-border-light bg-surface p-7 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sage text-2xl font-bold text-white">
          {profile.user.name[0]}
        </div>
        <h1 className="font-display text-[24px] font-bold text-ink">{profile.user.name}</h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <p className="text-sm text-ink-muted">{profile.user.school}</p>
          {certStatus === 'verified' && (
            <span className="flex items-center gap-1 rounded-full bg-sage-light px-2 py-0.5 text-xs font-medium text-sage">
              <Award size={12} />
              已认证
            </span>
          )}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border-light pt-5">
          <Stat value={profile.stats.helpedCount} label="帮助了" />
          <Stat value={profile.stats.articleCount} label="写了" />
          <Stat value={profile.stats.favoriteCount} label="收藏" />
        </div>
      </section>

      <Section title="我的空间" icon={<FileText size={17} />}>
        {profile.spaces.length === 0 ? (
          <Empty text="暂无维护空间" />
        ) : (
          profile.spaces.map((space) => <Row key={space.id} title={space.title} sub={`${space.articleCount} 篇文章`} />)
        )}
      </Section>

      <Section title="下一步能力" icon={<Settings size={17} />}>
        <Row title={nextAbility.title} sub={nextAbility.description} />
      </Section>

      <Section title="通知" icon={<Bell size={17} />}>
        {notifications.length === 0 ? (
          <Empty text="暂无通知" />
        ) : (
          <>
            {notifications.length > visibleNotifications.length && (
              <div className="border-b border-border-light px-5 py-2 text-xs text-ink-muted">
                共 {notifications.length} 条，显示最近 {visibleNotifications.length} 条
              </div>
            )}
            {visibleNotifications.map((item) => (
              <button
                key={item.id}
                onClick={async () => {
                  if (!item.isRead) {
                    setNotificationError('');
                    try {
                      await api.markNotificationRead(item.id);
                      markNotificationRead(item.id);
                    } catch (err) {
                      setNotificationError(err instanceof Error ? err.message : '通知标记已读失败，请稍后重试。');
                    }
                  }
                }}
                className="block w-full border-b border-border-light px-5 py-3.5 text-left last:border-b-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{item.title}</div>
                    <div className="mt-0.5 text-xs leading-5 text-ink-muted">{item.content}</div>
                  </div>
                  {!item.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sage" />}
                </div>
              </button>
            ))}
            {notificationError && <div className="px-5 py-3 text-sm text-rose-custom">{notificationError}</div>}
          </>
        )}
      </Section>

      <Section title="我的内容" icon={<FileText size={17} />}>
        {profile.contents.length === 0 ? (
          <Empty text="暂无个人内容" />
        ) : (
          profile.contents
            .slice(0, 4)
            .map((item) => (
              <Row
                key={item.id}
                title={'title' in item ? item.title : item.content}
                sub={'helpfulCount' in item ? `${item.helpfulCount} 人确认` : ''}
              />
            ))
        )}
      </Section>

      <Section title="我的收藏" icon={<Bookmark size={17} />}>
        {profile.favorites.length === 0 ? (
          <Empty text="暂无收藏" />
        ) : (
          profile.favorites.map((item) => (
            <Row key={item.id} title={item.title} sub={item.targetType === 'article' ? '文章' : '空间'} />
          ))
        )}
      </Section>

      <Section title="设置" icon={<Settings size={17} />}>
        <Row title="账号设置" sub="基础资料与登录状态" />
        {profile.canCreateSpace && <Row title="创建空间" sub="你已解锁创建空间能力" />}
        {certStatus === 'none' && (
          <ActionRow
            icon={<Award size={16} />}
            title="学生认证"
            sub="认证后可获得更多权限和标识"
            actionLabel="申请认证"
            onAction={() => setCertDialogOpen(true)}
          />
        )}
        {certStatus === 'pending' && (
          <Row title="学生认证" sub="审核中，请耐心等待" />
        )}
        {certStatus === 'rejected' && (
          <ActionRow
            icon={<Award size={16} />}
            title="学生认证"
            sub="认证未通过，可重新申请"
            actionLabel="重新申请"
            onAction={() => setCertDialogOpen(true)}
          />
        )}
      </Section>

      <Section title="账号与数据" icon={<ShieldCheck size={17} />}>
        <ActionRow
          icon={<Download size={16} />}
          title="数据导出"
          sub={exportResult ? `已生成 ${formatDateTime(exportResult.exportedAt)}` : '导出账号、同意记录和内容互动数据'}
          actionLabel={exportLoading ? '导出中...' : '导出数据'}
          disabled={exportLoading}
          onAction={exportData}
        />
        {exportError && <InlineError text={exportError} />}
        {exportResult && (
          <div className="border-b border-border-light px-5 py-3.5">
            <div className="mb-2 text-xs font-semibold text-ink-muted">导出内容</div>
            <pre className="max-h-48 overflow-auto rounded-lg bg-bg-subtle p-3 text-xs leading-5 text-ink-secondary">
              {JSON.stringify(exportResult.payload, null, 2)}
            </pre>
          </div>
        )}

        <div className="border-b border-border-light px-5 py-3.5 last:border-b-0">
          <div className="flex items-start gap-2">
            <Trash2 size={16} className="mt-0.5 text-rose-custom" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">注销账号</div>
              <div className="mt-0.5 text-xs leading-5 text-ink-muted">
                申请提交后由后台处理，处理完成后当前登录状态会失效。
              </div>
            </div>
          </div>
          <textarea
            value={deletionReason}
            onChange={(event) => setDeletionReason(event.target.value)}
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
            placeholder="注销原因（可选）"
          />
          <button
            type="button"
            disabled={deletionLoading}
            onClick={requestDeletion}
            className="mt-3 rounded-lg bg-rose-custom px-4 py-2 text-sm font-semibold text-white transition-colors disabled:bg-ink-faint"
          >
            {deletionLoading ? '提交中...' : '提交注销申请'}
          </button>
          {deletionError && <div className="mt-3 text-sm text-rose-custom">{deletionError}</div>}
          {deletionRequest && (
            <div className="mt-3 rounded-lg bg-sage-light px-3 py-2 text-sm text-sage">
              注销申请已提交，当前状态：
              {toDeletionStatusText(deletionRequest.status)}
            </div>
          )}
        </div>
      </Section>
      {certDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setCertDialogOpen(false)}>
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-sage" />
                <h3 className="text-lg font-semibold text-ink">申请学生认证</h3>
              </div>
              <button onClick={() => setCertDialogOpen(false)} className="text-ink-faint hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-ink-muted">
              认证通过后，你将获得学生标识，并可解锁更多平台权限。
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">学校 ID</label>
                <input
                  value={certSchoolId}
                  onChange={(e) => setCertSchoolId(e.target.value)}
                  placeholder="例如：heibeixueyuan"
                  className="h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm outline-none focus:border-sage"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">学校名称</label>
                <input
                  value={certSchoolName}
                  onChange={(e) => setCertSchoolName(e.target.value)}
                  placeholder="例如：黑河学院"
                  className="h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm outline-none focus:border-sage"
                />
              </div>
            </div>
            {certError && <div className="mt-3 text-sm text-rose-custom">{certError}</div>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={submitCertApplication}
                disabled={certSubmitting}
                className="flex-1 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white disabled:bg-ink-faint"
              >
                {certSubmitting && <LoaderCircle size={15} className="mr-1.5 inline animate-spin" />}
                提交申请
              </button>
              <button
                onClick={() => {
                  setCertDialogOpen(false);
                  setCertSchoolId('');
                  setCertSchoolName('');
                  setCertError('');
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-bg-subtle"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-[22px] font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border-light bg-surface">
      <div className="flex items-center gap-2 border-b border-border-light px-5 py-4 font-display text-[16px] font-bold text-ink">
        <span className="text-sage">{icon}</span>
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="border-b border-border-light px-5 py-3.5 last:border-b-0">
      <div className="text-sm font-medium text-ink">{title}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

function ActionRow({
  icon,
  title,
  sub,
  actionLabel,
  disabled,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-light px-5 py-3.5">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 text-sage">{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">{title}</div>
          {sub && <div className="mt-0.5 text-xs leading-5 text-ink-muted">{sub}</div>}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className="shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-semibold text-ink-secondary transition-colors hover:border-sage hover:text-sage disabled:bg-bg-subtle disabled:text-ink-faint"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function InlineError({ text }: { text: string }) {
  return <div className="border-b border-border-light px-5 py-3 text-sm text-rose-custom">{text}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-6 text-sm text-ink-muted">{text}</div>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function toDeletionStatusText(status: AccountDeletionRequestRecord['status']) {
  const map: Record<AccountDeletionRequestRecord['status'], string> = {
    pending: '待处理',
    in_review: '审核中',
    processing: '处理中',
    completed: '已完成',
    rejected: '已驳回',
  };

  return map[status];
}

function getNextAbility(canWrite: boolean, canCreateSpace: boolean) {
  if (!canWrite) {
    return {
      title: '继续发帖和回复',
      description: '多贡献真实经验、解决求助后，可解锁文章创作能力。',
    };
  }

  if (!canCreateSpace) {
    return {
      title: '继续沉淀文章',
      description: '持续维护高质量内容后，可解锁创建空间能力。',
    };
  }

  return {
    title: '维护空间和文章体系',
    description: '你已可以创建空间，下一步是把高频问题整理成稳定内容。',
  };
}
