import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useContentStore } from '@/store/useContentStore';
import { useAppStore } from '@/store/useAppStore';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { DocRenderer } from '../../components/DocRenderer';
import { extractDocToc } from '@/utils/docMarkdown';
import type { ContentAsset, ContentItem, ContentVisibility, Domain } from '@/types';

interface ContentEditorInnerProps {
  item: ContentItem;
  updateDraft: (id: string, patch: Partial<ContentItem>) => void;
  publish: (id: string) => void;
  unpublish: (id: string) => void;
  upsertAsset: (asset: ContentAsset) => void;
  onBack: () => void;
}

const ContentEditorInner: React.FC<ContentEditorInnerProps> = ({
  item,
  updateDraft,
  publish,
  unpublish,
  upsertAsset,
  onBack,
}) => {
  const [mdDraft, setMdDraft] = useState(item.markdown);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const saveNow = (markdown: string) => {
    updateDraft(item.id, { markdown });
    setSaving(false);
  };

  const scheduleSave = (markdown: string) => {
    setSaving(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => saveNow(markdown), 2000);
  };

  const wordCount = mdDraft.trim() ? mdDraft.trim().split(/\s+/).length : 0;
  const toc = extractDocToc(mdDraft);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">编辑文章</h1>
        <div className="space-x-2">
          {item.status === 'draft' ? (
            <button
              className="px-3 py-2 bg-green-600 text-white rounded-md"
              onClick={() => publish(item.id)}
            >
              发布
            </button>
          ) : (
            <button
              className="px-3 py-2 bg-slate-200 text-slate-800 rounded-md"
              onClick={() => unpublish(item.id)}
            >
              下架
            </button>
          )}
          <button
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md"
            onClick={onBack}
          >
            返回列表
          </button>
        </div>
      </div>

      {/* 元信息表单 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-slate-500">标题</label>
          <input
            className="w-full mt-1 px-3 py-2 border rounded-md"
            value={item.title}
            onChange={(e) => updateDraft(item.id, { title: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">封面图片 URL</label>
          <input
            className="w-full mt-1 px-3 py-2 border rounded-md"
            value={item.coverImageUrl}
            onChange={(e) => updateDraft(item.id, { coverImageUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">领域</label>
          <select
            className="w-full mt-1 px-3 py-2 border rounded-md"
            value={item.domain}
            onChange={(e) => updateDraft(item.id, { domain: e.target.value as Domain })}
          >
            <option value="creative">creative</option>
            <option value="dev">dev</option>
            <option value="work">work</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">可见性</label>
          <select
            className="w-full mt-1 px-3 py-2 border rounded-md"
            value={item.visibility}
            onChange={(e) =>
              updateDraft(item.id, { visibility: e.target.value as ContentVisibility })
            }
          >
            <option value="public">public</option>
            <option value="campus">campus</option>
          </select>
        </div>
        {item.visibility === 'campus' && (
          <div>
            <label className="text-xs text-slate-500">学校 ID</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={item.schoolId || ''}
              onChange={(e) => updateDraft(item.id, { schoolId: e.target.value })}
              placeholder="例如 heihe"
            />
          </div>
        )}
        <div className="md:col-span-2">
          <label className="text-xs text-slate-500">摘要</label>
          <textarea
            className="w-full mt-1 px-3 py-2 border rounded-md"
            rows={3}
            value={item.summary}
            onChange={(e) => updateDraft(item.id, { summary: e.target.value })}
          />
        </div>
      </div>

      {/* Markdown 编辑区（Obsidian 风格：大纲 / 编辑 / 预览）*/}
      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">正文（Markdown）</div>
          <div className="text-xs text-slate-400">大纲 / 编辑 / 预览</div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3 rounded-md border border-slate-200 bg-slate-50 p-3 max-h-[60vh] overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 mb-2">大纲</div>
            {toc.length ? (
              <div className="space-y-1 text-sm">
                {toc.map((t, idx) => (
                  <button
                    key={`${t.id}-${idx}`}
                    type="button"
                    onClick={() => scrollToHeading(t.id)}
                    style={{ paddingLeft: Math.max(0, (t.depth - 1) * 10) }}
                    className="block w-full text-left rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100"
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">暂无标题（请添加 # 标题）</div>
            )}
          </div>

          <div className="md:col-span-5">
            <MarkdownEditor
              value={mdDraft}
              onChange={(val) => {
                setMdDraft(val);
                scheduleSave(val);
              }}
              onSave={() => {
                if (timerRef.current) window.clearTimeout(timerRef.current);
                saveNow(mdDraft);
              }}
              onImageData={({ mime, size, dataUrl }) => {
                const asset: ContentAsset = {
                  id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
                  mime,
                  size,
                  dataUrl,
                  createdAt: new Date().toISOString(),
                };
                upsertAsset(asset);
              }}
            />
          </div>

          <div className="md:col-span-4 rounded-md border border-slate-200 p-3 max-h-[60vh] overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 mb-2">预览</div>
            <div className="prose prose-sm max-w-none prose-slate">
              <DocRenderer markdown={mdDraft} />
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态条 */}
      <div className="mt-3 text-xs text-slate-500">
        <span>{saving ? '保存中…' : item.updatedAt ? `已保存：${new Date(item.updatedAt).toLocaleString()}` : '未保存'}</span>
        <span className="ml-3">字数：{wordCount}</span>
      </div>
    </div>
  );
};

export const ContentEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ contentId: string }>();
  const location = useLocation();
  const { currentDomain } = useAppStore();
  const { createDraft, getArticleById, updateDraft, publish, unpublish, upsertAsset } = useContentStore();

  const isNew = location.pathname.endsWith('/new');

  useEffect(() => {
    if (isNew) {
      const id = createDraft({ domain: currentDomain });
      navigate(`/admin/content/${id}/edit`, { replace: true });
    }
  }, [isNew, createDraft, currentDomain, navigate]);

  const contentId = params.contentId;
  const item = useMemo(() => (contentId ? getArticleById(contentId) : undefined), [contentId, getArticleById]);

  if (!isNew && !item) {
    return <div className="max-w-3xl mx-auto p-6 text-slate-500">未找到内容。</div>;
  }

  if (!item) return null;

  return (
    <ContentEditorInner
      key={item.id}
      item={item}
      updateDraft={updateDraft}
      publish={publish}
      unpublish={unpublish}
      upsertAsset={upsertAsset}
      onBack={() => navigate('/admin/content')}
    />
  );
};
