import React from 'react';
import { useRoutes, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, Grid3X3, Compass } from 'lucide-react';
import { routes } from './routes';
import { CAMPUS_CATEGORIES } from './constants';

const CampusApp: React.FC = () => {
  const routeElement = useRoutes(routes);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <CampusHeader />
      <CampusCategoryTab />

      <main className="flex-grow pt-4 pb-16 md:pb-0">
        {routeElement}
      </main>

      <CampusFooter />

      <CampusMobileNav pathname={pathname} />
    </div>
  );
};

// 校园分类标签栏 — 横向滚动，药丸按钮
const CampusCategoryTab: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { slug: '__all', name: '推荐', color: '#3B82F6' },
    ...CAMPUS_CATEGORIES.map(c => ({ slug: c.slug, name: c.name, color: c.color })),
  ];

  const activeSlug = pathname === '/'
    ? '__all'
    : pathname.startsWith('/category/')
      ? pathname.split('/category/')[1]?.split('/')[0]
      : '__all';

  return (
    <div className="sticky top-14 z-30 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex gap-1.5 overflow-x-auto py-2.5" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => {
            const isActive = activeSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                onClick={() => navigate(tab.slug === '__all' ? '/' : '/category/' + tab.slug)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                style={isActive ? { backgroundColor: tab.color } : undefined}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 校园前端 Header
const CampusHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Compass size={18} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-800 leading-tight">盘根 · 校园</span>
            <span className="text-[10px] text-slate-400 leading-tight">xyzidea.cn</span>
          </div>
        </div>
        <a
          href="https://xyzidea.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          跳转全球站
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </header>
  );
};

// 校园前端 Footer
const CampusFooter: React.FC = () => {
  return (
    <footer className="hidden md:block border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
      <p>蜀ICP备2025165644号-1</p>
    </footer>
  );
};

// 校园移动端底部导航 — 完全独立，不依赖 AI 前端组件
const CampusMobileNav: React.FC<{ pathname: string }> = ({ pathname }) => {
  const navItems = [
    { to: '/', label: '首页', icon: Home },
    { to: '/category/food', label: '分类', icon: Grid3X3 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export { CampusApp };
