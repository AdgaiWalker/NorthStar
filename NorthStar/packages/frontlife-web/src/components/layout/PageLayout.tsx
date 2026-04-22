import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Header from './Header';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
}

const bottomNavRoutes = ['/', '/kb', '/profile'];

export default function PageLayout({ children }: PageLayoutProps) {
  const location = useLocation();
  const showBottomNav = bottomNavRoutes.includes(location.pathname) && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-bg">
      <Header />
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
