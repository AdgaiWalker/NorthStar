import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContentStore } from '../../store/useContentStore';
import { PropertiesPanel } from '../../components/admin/PropertiesPanel';
import { DocumentOutline } from '../../components/admin/DocumentOutline';
import { MarkdownEditor, MarkdownEditorRef } from '../../components/MarkdownEditor';
import type { ContentAsset, ContentItem } from '../../types';

/**
 * 内容工作室页面
 * Obsidian 风格三栏布局：文件树 / 编辑器 / 属性面板
 */
export const ContentStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ contentId?: string }>();

  // Store
  const {
    folders,
    getArticleById,
    getInheritedDomain,
    updateDraft,
    publish,
    unpublish,
    upsertAsset,
  } = useContentStore();

  // 当前编辑的内容
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    params.contentId ?? null
  );
  const currentItem = selectedContentId ? getArticleById(selectedContentId) : undefined;

  // 编辑器状态
  const [mdDraft, setMdDraft] = useState(currentItem?.markdown ?? '');
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 面板显示状态
  const [showProperties, setShowProperties] = useState(true);

  // 同步 URL 参数
  const paramsContentIdRef = useRef(params.contentId);
  paramsContentIdRef.current = params.contentId;

  useEffect(() => {
    const id = paramsContentIdRef.current;
    if (id && id !== selectedContentId) {
      setSelectedContentId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.contentId]);

  // 同步编辑器内容
  const currentItemIdRef = useRef(currentItem?.id);
  useEffect(() => {
    if (currentItem && currentItem.id !== currentItemIdRef.current) {
      currentItemIdRef.current = currentItem.id;
      setMdDraft(currentItem.markdown);
    }
  }, [currentItem]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // 编辑器引用
  const editorRef = useRef<MarkdownEditorRef>(null);

  // 当前活跃行（用于目录高亮）
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);

  const handleActiveLineChange = useCallback((lineIndex: number) => {
    setActiveLineIndex(lineIndex);
  }, []);

  // 处理滚动到指定行
  const handleScrollTo = useCallback((lineIndex: number) => {
    editorRef.current?.scrollToLine(lineIndex);
  }, []);

  // 保存函数
  const saveNow = useCallback((markdown: string) => {
    if (!selectedContentId) return;
    updateDraft(selectedContentId, { markdown });
    setSaving(false);
  }, [selectedContentId, updateDraft]);

  // 防抖保存
  const scheduleSave = useCallback((markdown: string) => {
    setSaving(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => saveNow(markdown), 2000);
  }, [saveNow]);

  // 处理编辑器变化
  const handleEditorChange = useCallback((value: string) => {
    setMdDraft(value);
    scheduleSave(value);
  }, [scheduleSave]);

  // 处理手动保存
  const handleManualSave = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    saveNow(mdDraft);
  }, [mdDraft, saveNow]);

  // 处理图片上传
  const handleImageData = useCallback((data: { mime: string; size: number; dataUrl: string }) => {
    const asset: ContentAsset = {
      id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      mime: data.mime,
      size: data.size,
      dataUrl: data.dataUrl,
      createdAt: new Date().toISOString(),
    };
    upsertAsset(asset);
  }, [upsertAsset]);


  // 处理属性更新
  const handleUpdateProperties = useCallback((patch: Partial<ContentItem>) => {
    if (!selectedContentId) return;
    updateDraft(selectedContentId, patch);
  }, [selectedContentId, updateDraft]);

  // 处理发布
  const handlePublish = useCallback(() => {
    if (!selectedContentId) return;
    // 先保存
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      saveNow(mdDraft);
    }
    publish(selectedContentId);
  }, [selectedContentId, mdDraft, saveNow, publish]);

  // 处理下架
  const handleUnpublish = useCallback(() => {
    if (!selectedContentId) return;
    unpublish(selectedContentId);
  }, [selectedContentId, unpublish]);

  // 获取继承的领域
  const inheritedDomain = currentItem?.folder
    ? getInheritedDomain(currentItem.folder)
    : undefined;

  // 字数统计
  const wordCount = mdDraft.trim() ? mdDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* 顶部工具栏 */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/content')}
            className="p-1.5 rounded-md hover:bg-slate-100"
            title="返回列表"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">内容工作室</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 保存状态 */}
          <span className="text-xs text-slate-500">
            {saving ? '保存中...' : currentItem?.updatedAt ? `已保存 ${new Date(currentItem.updatedAt).toLocaleTimeString()}` : ''}
          </span>

          {/* 字数 */}
          <span className="text-xs text-slate-400 mr-2">{wordCount} 字</span>

          {/* 操作按钮 */}
          {currentItem && (
            <>
              <button
                type="button"
                onClick={handleManualSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>

              {currentItem.status === 'draft' ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  <Send className="w-4 h-4" />
                  <span>发布</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                >
                  <Archive className="w-4 h-4" />
                  <span>下架</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* 主体三栏布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 中栏：编辑器 */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          {currentItem ? (
            <div className="flex-1 flex overflow-hidden">
              {/* 文档大纲 (常驻左侧) */}
              <DocumentOutline 
                markdown={mdDraft}
                activeLineIndex={activeLineIndex}
                onScrollTo={handleScrollTo}
                className="flex-shrink-0 z-10"
              />

              {/* 编辑区 */}
              <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                <MarkdownEditor
                  ref={editorRef}
                  value={mdDraft}
                  onChange={handleEditorChange}
                  onSave={handleManualSave}
                  onImageData={handleImageData}
                  onActiveLineChange={handleActiveLineChange}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-lg mb-2">选择或创建文章</p>
                <p className="text-sm">从左侧文件树选择一篇文章，或点击文件夹上的 + 创建新文章</p>
              </div>
            </div>
          )}
        </main>

        {/* 右侧隐藏式按钮 */}
        <button
          type="button"
          onClick={() => setShowProperties(!showProperties)}
          className={`absolute top-1/2 -translate-y-1/2 z-10 w-4 h-12 flex items-center justify-center bg-slate-200/80 hover:bg-slate-300 rounded-l transition-all ${
            showProperties && currentItem ? 'right-72' : 'right-0'
          }`}
          title={showProperties ? '隐藏属性' : '显示属性'}
        >
          {showProperties && currentItem ? (
            <ChevronRight className="w-3 h-3 text-slate-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-600" />
          )}
        </button>

        {/* 右栏：属性面板 */}
        {showProperties && currentItem && (
          <aside className="w-72 flex-shrink-0 border-l border-slate-200 overflow-hidden">
            <PropertiesPanel
              item={currentItem}
              folders={folders}
              inheritedDomain={inheritedDomain}
              onUpdate={handleUpdateProperties}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
