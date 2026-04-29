import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  LoaderCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { contentApi, platformApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { ContentItem, Domain } from '@ns/shared';

const DOMAIN_LABELS: Record<Domain, string> = {
  creative: '创意',
  dev: '开发',
  work: '工作',
};

const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600', icon: Clock },
  published: { label: '已发布', color: 'bg-green-100 text-green-600', icon: CheckCircle },
};

export const ContentStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, isLoggedIn } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const result = await contentApi.listContent();
        setItems(result.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载内容列表失败');
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
      } finally {
        setCheckingPermission(false);
      }
    };

    if (isLoggedIn) {
      loadContent();
      checkPermission();
    } else {
      setLoading(false);
      setCheckingPermission(false);
    }
  }, [isLoggedIn]);

  const handleCreate = () => {
    if (!canSubmit) {
      setError('您暂无内容创作权限，请联系管理员申请。');
      return;
    }
    navigate('/studio/new');
  };

  const handleEdit = (id: string) => {
    navigate(`/studio/${id}/edit`);
  };

  if (loading || checkingPermission) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center py-20 text-slate-400">
          <LoaderCircle className="mx-auto mb-4 animate-spin" size={32} />
          <p>正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <h2 className="text-xl font-bold mb-2">需要登录</h2>
          <p className="text-slate-500 mb-6">登录后才能访问内容工作室</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 animate-in fade-in ${isEyeCare ? 'bg-[#FDFCF8] min-h-screen' : ''}`}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="text-blue-600" size={28} />
              内容工作室
            </h1>
            <p className="mt-2 text-slate-500">创建和管理您的创意内容</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${
              canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus size={18} />
            新建内容
          </button>
        </div>
        {!canSubmit && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            您暂无内容创作权限，请联系管理员申请。
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <h3 className="text-lg font-bold mb-2">还没有内容</h3>
          <p className="text-slate-500 mb-6">创建您的第一篇内容吧</p>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
              canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus size={18} />
            创建内容
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const StatusIcon = STATUS_CONFIG[item.status].icon;
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                  isEyeCare ? 'bg-white border-stone-200' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg truncate">{item.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status].color}`}
                      >
                        {STATUS_CONFIG[item.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{item.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {DOMAIN_LABELS[item.domain as Domain]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                      {item.stats && (
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {item.stats.views} 次浏览
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
