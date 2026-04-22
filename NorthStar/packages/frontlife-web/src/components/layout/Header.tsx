import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const tabs = [
  { id: 'home', label: '最新', path: '/' },
  { id: 'kb', label: '知识库', path: '/kb' },
  { id: 'profile', label: '我的', path: '/profile' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useAppStore((s) => s.userName);

  const currentRoute =
    location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/kb')
        ? 'kb'
        : location.pathname === '/profile'
          ? 'profile'
          : 'home';

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
        <div
          onClick={() => navigate('/profile')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: '#5B7553' }}
        >
          {userName?.[0] ?? '张'}
        </div>
      </div>
    </nav>
  );
}
