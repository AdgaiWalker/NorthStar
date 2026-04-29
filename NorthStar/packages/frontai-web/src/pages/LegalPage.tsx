import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Shield, ArrowLeft, Calendar, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { complianceApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

type LegalType = 'terms' | 'privacy';

interface LegalDocument {
  title: string;
  content: string;
  version: string;
  publishedAt: string;
}

export const LegalPage: React.FC = () => {
  const { type } = useParams<{ type: LegalType }>();
  const navigate = useNavigate();
  const { themeMode } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';

  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!type || (type !== 'terms' && type !== 'privacy')) {
      navigate('/');
      return;
    }

    let cancelled = false;

    complianceApi
      .getLegalDocument(type)
      .then((doc) => {
        if (!cancelled) {
          setDocument(doc);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载法律文档失败，请稍后重试。');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-20 text-slate-400">
          <div className="animate-pulse">正在加载文档...</div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          {error || '文档加载失败'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 font-bold text-sm hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} /> 返回
        </button>
      </div>
    );
  }

  const title = type === 'terms' ? '用户协议' : '隐私政策';

  return (
    <div className={`max-w-4xl mx-auto px-4 py-12 animate-in fade-in ${isEyeCare ? 'bg-[#FDFCF8] min-h-screen' : ''}`}>
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> 返回
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${type === 'terms' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {type === 'terms' ? <FileText size={24} /> : <Shield size={24} />}
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Tag size={14} />
            版本 {document.version}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(document.publishedAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      <div
        className={`p-8 rounded-2xl ${
          isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm border border-slate-100'
        }`}
      >
        <div className={`prose max-w-none ${isEyeCare ? 'prose-stone' : 'prose-slate'}`}>
          <h2 className="text-xl font-bold mb-6">{document.title}</h2>
          <ReactMarkdown>{document.content}</ReactMarkdown>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-slate-400">
        <p>最后更新：{new Date(document.publishedAt).toLocaleString('zh-CN')}</p>
      </div>
    </div>
  );
};
