import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { id: 'home', label: '首页', icon: Home, path: '/' },
  { id: 'explore', label: '探索', icon: BookOpen, path: '/explore' },
  { id: 'me', label: '我的', icon: User, path: '/me' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentRoute =
    location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/explore') || location.pathname.startsWith('/space')
        ? 'explore'
        : location.pathname === '/me'
          ? 'me'
          : 'home';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-bottom-nav-h items-center justify-around border-t border-border-light bg-white/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentRoute === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors',
              active ? 'text-sage' : 'text-ink-muted'
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className={cn('text-[10px]', active && 'font-semibold')}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
