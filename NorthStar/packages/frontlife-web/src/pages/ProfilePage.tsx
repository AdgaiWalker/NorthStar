import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Bookmark, FileText, Settings } from 'lucide-react';
import type { ProfileResponse } from '@ns/shared';
import { ErrorState, LoadingState } from '@/components/LoadingState';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const notifications = useUIStore((state) => state.notifications);
  const setNotifications = useUIStore((state) => state.setNotifications);
  const markNotificationRead = useUIStore((state) => state.markNotificationRead);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setNotificationError('');
    Promise.all([api.getProfile(), api.getNotifications()])
      .then(([profileResult, notificationResult]) => {
        setProfile(profileResult);
        setNotifications(notificationResult.notifications);
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
          <button onClick={() => navigate('/login')} className="mt-5 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white">
            去登录
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="mx-auto max-w-[640px] px-4 py-6"><LoadingState label="正在加载个人页..." /></div>;
  if (error || !profile) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-6">
        <ErrorState title="个人页加载失败" message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      </div>
    );
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const visibleNotifications = notifications.slice(0, 12);

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
        <p className="mt-1 text-sm text-ink-muted">{profile.user.school}</p>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border-light pt-5">
          <Stat value={profile.stats.helpedCount} label="帮助了" />
          <Stat value={profile.stats.articleCount} label="写了" />
          <Stat value={profile.stats.favoriteCount} label="收藏" />
        </div>
      </section>

      <Section title="我的空间" icon={<FileText size={17} />}>
        {profile.spaces.length === 0 ? <Empty text="暂无维护空间" /> : profile.spaces.map((space) => <Row key={space.id} title={space.title} sub={`${space.articleCount} 篇文章`} />)}
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
            {notificationError && (
              <div className="px-5 py-3 text-sm text-rose-custom">{notificationError}</div>
            )}
          </>
        )}
      </Section>

      <Section title="我的内容" icon={<FileText size={17} />}>
        {profile.contents.length === 0 ? (
          <Empty text="暂无个人内容" />
        ) : (
          profile.contents.slice(0, 4).map((item) => <Row key={item.id} title={'title' in item ? item.title : item.content} sub={'helpfulCount' in item ? `${item.helpfulCount} 人确认` : ''} />)
        )}
      </Section>

      <Section title="我的收藏" icon={<Bookmark size={17} />}>
        {profile.favorites.length === 0 ? <Empty text="暂无收藏" /> : profile.favorites.map((item) => <Row key={item.id} title={item.title} sub={item.targetType === 'article' ? '文章' : '空间'} />)}
      </Section>

      <Section title="设置" icon={<Settings size={17} />}>
        <Row title="账号设置" sub="基础资料与登录状态" />
        {profile.canCreateSpace && <Row title="创建空间" sub="你已解锁创建空间能力" />}
      </Section>
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

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-6 text-sm text-ink-muted">{text}</div>;
}
