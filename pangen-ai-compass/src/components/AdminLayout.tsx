import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Inbox,
  FileCheck,
  Users,
  List,
  ArrowLeft,
  Shield,
  FileText,
  PenTool,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: '内容工作室', path: '/admin/studio', icon: PenTool },
  { label: '内容列表', path: '/admin/content', icon: FileText },
  { label: '审核队列', path: '/admin/review-queue', icon: Inbox },
  { label: '待分配池', path: '/admin/unassigned', icon: List },
  { label: '审核员管理', path: '/admin/reviewers', icon: Users },
  { label: '审计日志', path: '/admin/audit', icon: FileCheck },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* 侧边导航 */}
      <aside className="w-60 border-r border-slate-200 bg-slate-50 px-4 py-6 hidden md:block">
        <div className="flex items-center gap-2 px-3 mb-6 text-slate-800">
          <Shield size={20} className="text-blue-600" />
          <span className="font-bold text-lg">系统后台</span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate('/')}
          className="mt-10 flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm"
        >
          <ArrowLeft size={14} /> 返回首页
        </button>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 px-6 py-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
