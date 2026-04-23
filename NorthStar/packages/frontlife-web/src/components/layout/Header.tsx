import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';

const tabs = [
  { id: 'home', label: '首页', path: '/' },
  { id: 'explore', label: '探索', path: '/explore' },
  { id: 'me', label: '我的', path: '/me' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useUserStore((s) => s.userName);
  const token = useUserStore((s) => s.token);
  const canPost = useUserStore((s) => s.permissions.canPost);
  const notifications = useUIStore((s) => s.notifications);
  const setNotifications = useUIStore((s) => s.setNotifications);
  const markNotificationRead = useUIStore((s) => s.markNotificationRead);
  const resetNotifications = useUIStore((s) => s.resetNotifications);
  const [open, setOpen] = useState(false);

  const currentRoute =
    location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/explore') || location.pathname.startsWith('/space')
        ? 'explore'
        : location.pathname === '/me'
          ? 'me'
          : 'home';

  useEffect(() => {
    if (!token) {
      resetNotifications();
      return;
    }

    api.getNotifications().then((result) => setNotifications(result.notifications)).catch(() => undefined);
  }, [resetNotifications, setNotifications, token]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-nav-h items-center justify-between border-b border-border-light bg-white/95 px-6 backdrop-blur-xl">
      {/* Brand */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2"
      >
        <span className="font-display text-xl font-bold text-ink">盘根</span>
      </button>

      {/* Desktop Tabs */}
      <div className="hidden items-center gap-0.5 md:flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.path)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
              currentRoute === t.id
                ? 'bg-sage-light font-semibold text-sage'
                : 'text-ink-muted hover:bg-bg-subtle hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {token && canPost && (
          <button
            onClick={() => navigate('/?write=1')}
            className="hidden items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark md:flex"
          >
            <PenLine size={15} />
            写点什么
          </button>
        )}
        {token && (
        <div className="relative hidden md:block">
          <button
            onClick={() => setOpen((value) => !value)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-bg-subtle hover:text-sage"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-rose-custom px-1.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-10 w-72 rounded-2xl border border-border-light bg-white p-3 shadow-lg">
              {notifications.length === 0 && <div className="px-2 py-4 text-sm text-ink-muted">暂无通知</div>}
              {notifications.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={async () => {
                    await api.markNotificationRead(item.id);
                    markNotificationRead(item.id);
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left hover:bg-bg-subtle"
                >
                  <div className="text-sm font-medium text-ink">{item.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{item.content}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
        <div
          onClick={() => navigate(token ? '/me' : '/login')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: '#5B7553' }}
        >
          {userName?.[0] ?? '登'}
        </div>
      </div>
    </nav>
  );
}
