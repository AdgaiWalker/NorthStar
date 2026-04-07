import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SuperSidebar } from '../components/admin/SuperSidebar';
import { ContextSidebar } from '../components/admin/ContextSidebar';

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Determine current module from path
  const pathParts = location.pathname.split('/');
  // /admin/studio -> studio
  // /admin/content -> content
  const module = pathParts[2] || 'dashboard';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Column 1: Super Sidebar */}
      <div className="relative z-20 flex-shrink-0">
        <SuperSidebar />
        
        {/* Expand Button (when collapsed) */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-600"
            title="展开侧边栏"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Column 2: Context Sidebar */}
      <ContextSidebar 
        isCollapsed={isCollapsed} 
        onCollapse={() => setIsCollapsed(true)}
        module={module}
      />

      {/* Column 3: Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Outlet />
      </div>
    </div>
  );
};
