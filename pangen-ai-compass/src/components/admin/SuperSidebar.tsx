import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Pencil, 
  FileText, 
  CheckSquare, 
  Users, 
  Wrench, 
  BarChart2, 
  CreditCard, 
  Settings,
  LogOut,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '../../store/useAppStore';

// Fallback for cn if not exists, but I assume it does based on Shadcn conventions usually used.
// If not I will verify later.

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          isActive 
            ? "bg-slate-800 text-white" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )
      }
      title={label}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
          )}
          <Icon size={20} />
        </>
      )}
    </NavLink>
  );
};

export const SuperSidebar: React.FC = () => {
  const { currentUser } = useAppStore();
  // Mock user for dev if not set
  const user = currentUser || { role: 'superadmin' as const };
  const role = user.role;

  const canView = (mod: string) => {
    if (role === 'superadmin') return true;
    if (role === 'admin') return mod !== 'roles';
    if (role === 'editor') return ['studio', 'content'].includes(mod);
    if (role === 'reviewer') return ['review'].includes(mod);
    return false;
  };

  return (
    <div className="flex h-screen w-14 flex-col items-center bg-slate-900 py-4">
      {/* Logo / Home */}
      <NavLink 
        to="/" 
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        title="返回前台"
      >
        <Home size={20} />
      </NavLink>

      <div className="flex flex-1 flex-col gap-6">
        {/* Content Group */}
        <div className="flex flex-col gap-2">
          {canView('studio') && <NavItem to="/admin/studio" icon={Pencil} label="内容工作室" />}
          {canView('content') && <NavItem to="/admin/content" icon={FileText} label="内容管理" />}
          {canView('review') && <NavItem to="/admin/review" icon={CheckSquare} label="审核工作台" />}
          {canView('tools') && <NavItem to="/admin/tools" icon={Wrench} label="工具管理" />}
        </div>
        
        <div className="h-px w-8 bg-slate-800" />

        {/* User Group */}
        <div className="flex flex-col gap-2">
          {canView('users') && <NavItem to="/admin/users" icon={Users} label="用户管理" />}
        </div>

        <div className="h-px w-8 bg-slate-800" />

        {/* Data Group */}
        <div className="flex flex-col gap-2">
          {canView('analytics') && <NavItem to="/admin/analytics" icon={BarChart2} label="数据中心" />}
        </div>

        <div className="h-px w-8 bg-slate-800" />

        {/* Operations Group */}
        <div className="flex flex-col gap-2">
          {canView('payments') && <NavItem to="/admin/payments" icon={CreditCard} label="支付管理" />}
          {canView('settings') && <NavItem to="/admin/settings" icon={Settings} label="系统设置" />}
        </div>
      </div>

      {/* User Avatar / Bottom */}
      <div className="mt-auto flex flex-col items-center gap-4">
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          title="退出登录"
        >
          <LogOut size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-slate-700">
           {/* Placeholder for avatar */}
           <img 
             src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
             alt="Admin"
             className="h-full w-full rounded-full"
           />
        </div>
      </div>
    </div>
  );
};
