import React, { useEffect, useState } from 'react';
import { useRoutes, useLocation } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { routes } from './routes';
import { useAppStore } from './store/useAppStore';
import { AppHeader, Footer } from './components/AppLayout';
import { MobileBottomNav } from './components/MobileBottomNav';
import { UI_COLORS, UI_DELAY } from './constants/ui';

const App: React.FC = () => {
  const { themeMode, storageResetDetected, dismissStorageResetNotice } = useAppStore();
  const routeElement = useRoutes(routes);
  const { pathname } = useLocation();

  // 移动端底部导航在后台或登录页不显示
  const isAdmin = pathname.startsWith('/admin');
  const showMobileNav = !isAdmin && !pathname.startsWith('/login');

  const [showNotice, setShowNotice] = useState(storageResetDetected);

  useEffect(() => {
    if (!showNotice) return;
    const t = window.setTimeout(() => {
      setShowNotice(false);
      dismissStorageResetNotice();
    }, UI_DELAY.TOAST_AUTO_HIDE);
    return () => window.clearTimeout(t);
  }, [showNotice, dismissStorageResetNotice]);

  const isEyeCare = themeMode === 'eye-care';
  const bgClass = isEyeCare
    ? 'min-h-screen text-stone-800'
    : 'bg-slate-50 min-h-screen text-slate-900';
  const rootStyle = isEyeCare ? { backgroundColor: UI_COLORS.EYE_CARE_BG } : undefined;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${bgClass}`}
      style={rootStyle}
    >
      {/* 存储重置提示 */}
      {showNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] px-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg">
            <AlertTriangle size={16} className="text-amber-300" />
            <span className="text-sm font-medium">
              本地数据异常，系统已重置到默认状态。
            </span>
            <button
              type="button"
              onClick={() => {
                setShowNotice(false);
                dismissStorageResetNotice();
              }}
              className="ml-1 p-1 rounded-full hover:bg-white/10"
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {!isAdmin && <AppHeader />}

      <main className={`flex-grow ${isAdmin ? 'p-0' : 'pt-6'} ${showMobileNav ? 'pb-16 md:pb-0' : ''}`}>
        {routeElement}
      </main>

      {!isAdmin && <Footer />}

      <MobileBottomNav />
    </div>
  );
};

export default App;
