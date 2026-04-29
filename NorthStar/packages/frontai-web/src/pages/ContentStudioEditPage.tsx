import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Send,
  ArrowLeft,
  LoaderCircle,
  FileText,
  Eye,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { contentApi, platformApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import { MarkdownEditor, type MarkdownEditorRef } from '@/components/MarkdownEditor';
import type { ContentItem, Domain } from '@ns/shared';
import ReactMarkdown from 'react-markdown';

const DOMAIN_OPTIONS: { value: Domain; label: string }[] = [
  { value: 'creative', label: '创意' },
  { value: 'dev', label: '开发' },
  { value: 'work', label: '工作' },
];

export const ContentStudioEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { themeMode, isLoggedIn } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [domain, setDomain] = useState<Domain>('creative');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [existingData, setExistingData] = useState<ContentItem | null>(null);

  const editorRef = useRef<MarkdownEditorRef>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const loadContent = async () => {
      if (isNew || !id) return;

      try {
        const result = await contentApi.getContent(id);
        setExistingData(result);
        setTitle(result.title);
        setSummary(result.summary);
        setDomain((result.domain as Domain) || 'creative');
        setMarkdown(result.markdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载内容失败');
      } finally {
        setLoading(false);
      }
    };

    const checkPermission = async () => {
      try {
        const caps = await platformApi.getCompassCapabilities();
        setCanSubmit(caps.canSubmitContent || false);
      } catch {
        setCanSubmit(false);
      }
    };

    loadContent();
    checkPermission();
  }, [id, isNew, isLoggedIn, navigate]);

  const handleSave = async () => {
    if (!id && !isNew) {
      setError('无效的内容 ID');
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!title.trim()) {
        setError('请输入标题');
        setSaving(false);
        return;
      }

      if (!summary.trim()) {
        setError('请输入摘要');
        setSaving(false);
        return;
      }

      if (!markdown.trim()) {
        setError('请输入内容');
        setSaving(false);
        return;
      }

      const data = {
        title: title.trim(),
        summary: summary.trim(),
        domain,
        markdown: markdown.trim(),
      };

      if (isNew) {
        const result = await contentApi.createContent(data);
        setSuccess('内容已保存');
        hasUnsavedChanges.current = false;
        setTimeout(() => {
          navigate(`/studio/${result.id}/edit`);
        }, 500);
      } else {
        await contentApi.updateContent(id!, data);
        setSuccess('内容已更新');
        hasUnsavedChanges.current = false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!id && !isNew) {
      setError('无效的内容 ID');
      return;
    }

    if (!canSubmit) {
      setError('您暂无内容提交权限');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!title.trim() || !summary.trim() || !markdown.trim()) {
        setError('请完善所有必填字段');
        setSubmitting(false);
        return;
      }

      // 先保存
      const data = {
        title: title.trim(),
        summary: summary.trim(),
        domain,
        markdown: markdown.trim(),
      };

      let contentId = id!;
      if (isNew) {
        const result = await contentApi.createContent(data);
        contentId = result.id;
      } else {
        await contentApi.updateContent(id!, data);
      }

      // 提交审核
      await contentApi.submitContentForReview(contentId);
      setSuccess('内容已提交审核');
      hasUnsavedChanges.current = false;
      setTimeout(() => {
        navigate('/studio');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <LoaderCircle className="mx-auto mb-4 animate-spin text-slate-400" size={32} />
          <p className="text-slate-400">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 animate-in fade-in ${isEyeCare ? 'bg-[#FDFCF8] min-h-screen' : ''}`}>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{isNew ? '新建内容' : '编辑内容'}</h1>
              <p className="text-sm text-slate-500">创建并管理您的创意内容</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                previewMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eye size={16} />
              {previewMode ? '编辑' : '预览'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              保存
            </button>
            {!isNew && existingData?.status !== 'published' && (
              <button
                onClick={handleSubmit}
                disabled={submitting || saving || !canSubmit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                提交审核
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 space-y-6 ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100'} rounded-2xl p-6`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                hasUnsavedChanges.current = true;
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="输入内容标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              摘要 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                hasUnsavedChanges.current = true;
              }}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              placeholder="简要描述内容概要"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              领域
            </label>
            <div className="flex gap-3">
              {DOMAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDomain(opt.value);
                    hasUnsavedChanges.current = true;
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    domain === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {previewMode ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                预览
              </label>
              <div className={`p-6 rounded-xl border ${isEyeCare ? 'border-stone-200 bg-stone-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="prose max-w-none">
                  <ReactMarkdown>{markdown || '<p class="text-slate-400">暂无内容</p>'}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                内容 <span className="text-red-500">*</span>
              </label>
              <MarkdownEditor
                ref={editorRef}
                value={markdown}
                onChange={(value) => {
                  setMarkdown(value);
                  hasUnsavedChanges.current = true;
                }}
                onSave={handleSave}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100'} rounded-2xl p-6`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              快捷提示
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>支持 Markdown 语法，可添加标题、列表、代码块等</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>可直接粘贴图片，系统会自动处理</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Ctrl/Cmd + S 快速保存</span>
              </li>
            </ul>
          </div>

          {!canSubmit && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} />
                <span className="font-medium">权限提示</span>
              </div>
              <p>您暂无内容提交权限，请联系管理员申请。</p>
            </div>
          )}

          {existingData && (
            <div className={`${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100'} rounded-2xl p-6`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                内容信息
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">状态</span>
                  <span className="font-medium">{existingData.status === 'published' ? '已发布' : '草稿'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">创建时间</span>
                  <span className="font-medium">{new Date(existingData.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">更新时间</span>
                  <span className="font-medium">{new Date(existingData.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
