import React from 'react';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { DomainBadge } from '../ui/DomainBadge';
import type { ContentItem, ContentVisibility, Domain, FolderMeta } from '@/types';

interface PropertiesPanelProps {
  item: ContentItem;
  folders: FolderMeta[];
  inheritedDomain: Domain | undefined;
  onUpdate: (patch: Partial<ContentItem>) => void;
}

/**
 * 属性检视器组件
 * 用于内容工作室的右侧属性面板
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  item,
  folders,
  inheritedDomain,
  onUpdate,
}) => {
  // 判断当前领域是否为继承的
  const isInheritedDomain = inheritedDomain !== undefined && item.domain === inheritedDomain;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="px-3 py-2 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">属性</span>
      </div>

      {/* 属性分组 */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* 基础属性 */}
        <CollapsibleSection title="基础属性" defaultOpen>
          {/* 标题 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">标题</label>
            <input
              type="text"
              value={item.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="文章标题"
            />
          </div>

          {/* 文件夹 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">文件夹</label>
            <select
              value={item.folder || ''}
              onChange={(e) => onUpdate({ folder: e.target.value || undefined })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">未分类</option>
              {folders.map((f) => (
                <option key={f.path} value={f.path}>
                  {f.path}
                </option>
              ))}
            </select>
          </div>

          {/* 领域 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">领域</label>
            <div className="flex items-center gap-2">
              <select
                value={item.domain}
                onChange={(e) => onUpdate({ domain: e.target.value as Domain })}
                className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="creative">创作</option>
                <option value="dev">开发</option>
                <option value="work">办公</option>
              </select>
              <DomainBadge domain={item.domain} inherited={isInheritedDomain} />
            </div>
            {isInheritedDomain && (
              <p className="text-xs text-slate-400 mt-1">
                继承自文件夹 {item.folder}
              </p>
            )}
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">摘要</label>
            <textarea
              value={item.summary}
              onChange={(e) => onUpdate({ summary: e.target.value })}
              rows={3}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="文章摘要..."
            />
          </div>
        </CollapsibleSection>

        {/* 发布设置 */}
        <CollapsibleSection title="发布设置" defaultOpen>
          {/* 可见性 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">可见性</label>
            <select
              value={item.visibility}
              onChange={(e) => onUpdate({ visibility: e.target.value as ContentVisibility })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="public">公开</option>
              <option value="campus">校内专区</option>
            </select>
          </div>

          {/* 学校 ID（仅校内可见时） */}
          {item.visibility === 'campus' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">学校 ID</label>
              <input
                type="text"
                value={item.schoolId || ''}
                onChange={(e) => onUpdate({ schoolId: e.target.value || undefined })}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如 heihe"
              />
              <p className="text-xs text-slate-400 mt-1">
                仅该学校认证用户可见
              </p>
            </div>
          )}

          {/* 发布状态指示 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">状态</label>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  item.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.status === 'published' ? '已发布' : '草稿'}
              </span>
              {item.publishedAt && (
                <span className="text-xs text-slate-400">
                  {new Date(item.publishedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* 高级属性 */}
        <CollapsibleSection title="高级属性" defaultOpen={false}>
          {/* 封面图 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">封面图 URL</label>
            <input
              type="text"
              value={item.coverImageUrl}
              onChange={(e) => onUpdate({ coverImageUrl: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://..."
            />
            {item.coverImageUrl && (
              <div className="mt-2">
                <img
                  src={item.coverImageUrl}
                  alt="封面预览"
                  className="w-full h-24 object-cover rounded-md border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">标签</label>
            <input
              type="text"
              value={item.tags.join(', ')}
              onChange={(e) =>
                onUpdate({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="标签1, 标签2, ..."
            />
            <p className="text-xs text-slate-400 mt-1">
              用逗号分隔。特殊标签：featured（精选）、topic:xxx（专题）
            </p>
          </div>

          {/* 关联工具 ID */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">关联工具 ID</label>
            <input
              type="text"
              value={item.relatedToolIds.join(', ')}
              onChange={(e) =>
                onUpdate({
                  relatedToolIds: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="工具ID1, 工具ID2, ..."
            />
          </div>

          {/* 统计信息（只读） */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">统计</label>
            <div className="flex gap-4 text-sm text-slate-600">
              <span>👁 {item.stats.views} 浏览</span>
              <span>❤️ {item.stats.likes} 点赞</span>
            </div>
          </div>

          {/* 时间信息（只读） */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">时间</label>
            <div className="text-xs text-slate-500 space-y-1">
              <div>创建：{new Date(item.createdAt).toLocaleString()}</div>
              <div>更新：{new Date(item.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};
