import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n';

const NAV_ITEMS = [
  { key: 'home', i18nKey: 'nav.home', icon: Home, path: '/' },
  { key: 'solution', i18nKey: 'nav.solution', icon: Sparkles, path: '/solution/new' },
  { key: 'me', i18nKey: 'nav.me', icon: User, path: '/me' },
];

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { language } = useAppStore();

  // 判断当前激活的 tab
  const getActiveKey = () => {
    if (pathname === '/' || pathname.startsWith('/article') || pathname.startsWith('/tool')) return 'home';
    if (pathname.startsWith('/solution')) return 'solution';
    if (pathname.startsWith('/me')) return 'me';
    return '';
  };

  const activeKey = getActiveKey();

  // 在后台页不显示
  if (pathname.startsWith('/admin') || pathname.startsWith('/login')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-pb">
      <div className="flex justify-around items-center h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : ''}`}>{t(item.i18nKey, language)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
