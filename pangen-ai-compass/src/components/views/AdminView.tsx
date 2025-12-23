import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  Wrench, 
  BarChart2, 
  PieChart, 
  CreditCard, 
  Cpu, 
  Settings,
  Search,
  Filter,
  Plus,
  Box
} from 'lucide-react';
import { ViewState } from '../../types';

interface AdminViewProps {
  navigate: (view: ViewState) => void;
}

type AdminSection = 'content' | 'users' | 'approvals' | 'tools' | 'stats' | 'dashboard' | 'payments' | 'ai' | 'settings';

const MENU_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'content', label: '内容管理', icon: <LayoutDashboard size={20} />, desc: '管理文章、视频教程及专栏内容' },
  { id: 'users', label: '用户管理', icon: <Users size={20} />, desc: '查看用户列表、权限及封禁状态' },
  { id: 'approvals', label: '认证审核', icon: <CheckCircle size={20} />, desc: '处理实名认证与专家入驻申请' },
  { id: 'tools', label: '工具管理', icon: <Wrench size={20} />, desc: '上架、下架及维护 AI 工具库' },
  { id: 'stats', label: '数据统计', icon: <BarChart2 size={20} />, desc: '核心业务指标与增长趋势' },
  { id: 'dashboard', label: '数据看板', icon: <PieChart size={20} />, desc: '实时流量与用户行为分析' },
  { id: 'payments', label: '支付管理', icon: <CreditCard size={20} />, desc: '订单流水、提现及发票管理' },
  { id: 'ai', label: 'AI 引擎', icon: <Cpu size={20} />, desc: '配置模型参数与 Prompt 模板' },
  { id: 'settings', label: '系统设置', icon: <Settings size={20} />, desc: '平台基础配置与权限分配' },
];

export const AdminView: React.FC<AdminViewProps> = ({ navigate }) => {
  // Simple state for prototype, in real app this would sync with URL params
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') as AdminSection;
    if (section && MENU_ITEMS.find(m => m.id === section)) {
      return section;
    }
    return 'content';
  });

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    // In a real app, we would push history here
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('section', section);
    window.history.pushState({}, '', newUrl.toString());
  };

  const activeMenu = MENU_ITEMS.find(m => m.id === activeSection) || MENU_ITEMS[0];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 animate-in fade-in">
      {/* Sidebar */}
      <div className="w-20 md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <Shield className="text-blue-600" />
            <span>管理后台</span>
          </div>
        </div>
        
        <nav className="p-2 md:p-4 space-y-1 flex-1">
          {MENU_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={item.label}
            >
              <span className={activeSection === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}>
                {item.icon}
              </span>
              <span className="hidden md:block">{item.label}</span>
              {activeSection === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 hidden md:block" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => navigate({ type: 'home' })}
            className="w-full py-2 px-4 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center md:justify-start gap-2"
          >
            <span className="md:hidden">←</span>
            <span className="hidden md:inline">退出管理后台</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-hidden">
        {/* Header Section */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {activeMenu.label}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">{activeMenu.desc}</p>
            </div>
            
            <div className="flex items-center gap-3">
               <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
                 <Plus size={16} /> 新增
               </button>
            </div>
          </div>
        </header>

        {/* Filters Bar */}
        <div className="px-8 py-4 bg-white border-b border-slate-200 flex flex-wrap gap-4 items-center flex-shrink-0">
          <div className="relative w-full md:w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="搜索关键字..." 
               className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
             />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Filter size={14} /> 筛选
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <select className="px-3 py-2 bg-transparent border-none text-sm font-medium text-slate-600 focus:outline-none cursor-pointer">
              <option>最近7天</option>
              <option>最近30天</option>
            </select>
          </div>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Empty State Prototype */}
          <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <Box size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">暂无{activeMenu.label}数据</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              当前板块尚未录入任何数据。您可以点击右上角按钮添加新条目，或调整筛选条件。
            </p>
            <button className="px-6 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold rounded-xl transition-all shadow-sm">
              刷新列表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
