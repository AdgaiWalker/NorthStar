import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SESSION_EXPIRED_REASON } from '@/services/authSession';
import { useUIStore } from '@/store/useUIStore';
import Header from './Header';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
}

const bottomNavRoutes = ['/', '/explore', '/me'];

export default function PageLayout({ children }: PageLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionExpiredMessage = useUIStore((state) => state.sessionExpiredMessage);
  const clearSessionExpired = useUIStore((state) => state.clearSessionExpired);
  const showBottomNav = bottomNavRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <Header />
      {sessionExpiredMessage && (
        <div className="border-b border-amber-light bg-amber-light text-amber-custom">
          <div className="mx-auto flex max-w-content-max flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-2 text-sm leading-6">
              <AlertTriangle size={16} className="mt-1 shrink-0" />
              <span>{sessionExpiredMessage}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/login?reason=${SESSION_EXPIRED_REASON}`)}
                className="rounded-lg bg-amber-custom px-3 py-1.5 text-sm font-semibold text-white"
              >
                去登录
              </button>
              <button
                onClick={clearSessionExpired}
                className="rounded-lg border border-amber-custom/25 bg-white/70 px-3 py-1.5 text-sm font-semibold text-amber-custom"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      <main
        className={cn(
          'pt-nav-h',
          showBottomNav && 'pb-bottom-nav-h md:pb-0'
        )}
      >
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
