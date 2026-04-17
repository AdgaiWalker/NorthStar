import React from 'react';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentStore } from '@/store/useContentStore';
import { FileTree } from './FileTree';
import { useNavigate, useParams } from 'react-router-dom';
import type { Domain } from '@/types';

interface ContextSidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
  module: string; // derived from route path
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  isCollapsed,
  onCollapse,
  module,
}) => {
  const navigate = useNavigate();
  const params = useParams<{ contentId?: string }>();

  // Content Studio Store logic
  const { 
    createDraft,
    createFolder,
    updateFolder,
    moveContent,
    updateSortIndex,
    getFolderTree
  } = useContentStore();

  const tree = getFolderTree();
  const selectedContentId = params.contentId ?? null;

  const handleCreateContent = (folder: string | null) => {
    const id = createDraft({ folder: folder ?? undefined });
    navigate(`/admin/studio/${id}`, { replace: true });
  };

  const handleSelectContent = (id: string) => {
    navigate(`/admin/studio/${id}`, { replace: true });
  };

  const handleCreateFolder = (parentPath: string | null) => {
    const raw = window.prompt('请输入文件夹名称');
    const name = (raw ?? '').trim().replace(/^\/+|\/+$/g, '');
    if (!name) return;

    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;
    createFolder(path);
  };

  const handleSetFolderDomain = (path: string, domain: Domain) => {
    updateFolder(path, { domain });
  };

  if (isCollapsed) return null;

  return (
    <div className="relative flex h-screen w-60 flex-col border-r border-slate-200 bg-slate-50 transition-all duration-200 ease-out">
      {/* Collapse Button */}
      <button
        onClick={onCollapse}
        className="absolute -right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-600"
        title="收起侧边栏"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Module Content */}
      <div className="flex h-full flex-col">
        {/* Header Area: Search & Create */}
        <div className="flex flex-col gap-3 p-3">
            {/* Create Button */}
            <button
              type="button"
              onClick={() => {
                if (module === 'studio') {
                  handleCreateContent(null);
                  return;
                }
                if (module === 'content') {
                  navigate('/admin/content/new');
                  return;
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>
                {module === 'studio' ? '新建内容' : module === 'content' ? '新建内容' : module === 'tools' ? '新建工具' : '新建'}
              </span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索..."
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {module === 'studio' && (
             <div className="px-2">
                <div className="mb-2 flex flex-col gap-1 px-2">
                  <button className="text-left text-sm text-slate-600 hover:text-blue-600">最近编辑</button>
                  <button className="text-left text-sm text-slate-600 hover:text-blue-600">草稿箱</button>
                  <button className="text-left text-sm text-slate-600 hover:text-blue-600">已发布</button>
                </div>
                <div className="h-px w-full bg-slate-200 my-2" />
                <FileTree
                  tree={tree}
                  selectedContentId={selectedContentId}
                  onSelectContent={handleSelectContent}
                  onCreateContent={handleCreateContent}
                  onCreateFolder={handleCreateFolder}
                  onSetFolderDomain={handleSetFolderDomain}
                  onMoveContent={moveContent}
                  onReorderContent={updateSortIndex}
                />
             </div>
          )}

          {module === 'content' && (
            <div className="px-4 py-2">
              <div className="flex flex-col gap-4">
                 <FilterGroup label="状态" options={['全部', '草稿', '已发布', '待审核']} />
                 <FilterGroup label="类型" options={['全部', '文章', '视频', '工具']} />
                 <FilterGroup label="领域" options={['全部', '影视创作', '编程开发', '职场效能']} />
              </div>
            </div>
          )}

          {module === 'review' && (
             <div className="px-4 py-2">
               <div className="flex flex-col gap-2">
                  <SidebarTab label="审核队列" active />
                  <SidebarTab label="待分配池" />
                  <SidebarTab label="审核员管理" />
               </div>
               <div className="mt-6 flex flex-col gap-4">
                 <FilterGroup label="状态" options={['待审核', '审核中', '已通过', '已拒绝']} />
               </div>
             </div>
          )}
          
          {module === 'users' && (
             <div className="px-4 py-2">
               <div className="flex flex-col gap-2">
                  <SidebarTab label="用户列表" active />
                  <SidebarTab label="认证审核" />
               </div>
               <div className="mt-6 flex flex-col gap-4">
                 <FilterGroup label="角色" options={['全部', '普通用户', '学生', '会员']} />
                 <FilterGroup label="学校" options={['全部', '北电', '中戏', '中传']} />
               </div>
             </div>
          )}

          {/* Fallback for others */}
          {!['studio', 'content', 'review', 'users'].includes(module) && (
             <div className="px-4 py-2 text-sm text-slate-500">
               {module} 模块的筛选条件
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterGroup: React.FC<{ label: string; options: string[] }> = ({ label, options }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-slate-500">{label}</label>
    <select className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const SidebarTab: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <button className={cn(
    "w-full rounded px-2 py-1.5 text-left text-sm transition-colors",
    active ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-600 hover:bg-slate-100"
  )}>
    {label}
  </button>
);
