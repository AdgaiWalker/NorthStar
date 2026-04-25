import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import type { LegalDocumentRecord, LegalDocumentType } from '@ns/shared';
import { ErrorState, LoadingState } from '@/components/LoadingState';
import { api } from '@/services/api';

interface LegalDocumentPageProps {
  type: LegalDocumentType;
}

export default function LegalDocumentPage({ type }: LegalDocumentPageProps) {
  const [document, setDocument] = useState<LegalDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .listLegalDocuments(type)
      .then((result) => {
        setDocument(result.items[0] ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '协议加载失败，请稍后重试。'))
      .finally(() => setLoading(false));
  }, [reloadKey, type]);

  if (loading) {
    return (
      <div className="mx-auto max-w-reader-max px-4 py-6">
        <LoadingState label="正在加载协议..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-reader-max px-4 py-6">
        <ErrorState title="协议加载失败" message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="mx-auto max-w-reader-max px-4 py-10">
        <div className="rounded-2xl border border-border-light bg-surface p-7 text-center">
          <FileText size={24} className="mx-auto text-ink-muted" />
          <h1 className="mt-3 font-display text-[22px] font-bold text-ink">
            {type === 'terms' ? '用户协议暂未发布' : '隐私政策暂未发布'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">请稍后再查看。</p>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-reader-max px-4 py-8">
      <div className="mb-5 flex items-center gap-2 text-sm text-ink-muted">
        <FileText size={16} className="text-sage" />
        版本 {document.version}
      </div>
      <h1 className="font-display text-[28px] font-bold text-ink">{document.title}</h1>
      <p className="mt-2 text-sm text-ink-muted">发布于 {new Date(document.publishedAt).toLocaleDateString('zh-CN')}</p>
      <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-border-light bg-surface p-6 text-sm leading-7 text-ink-secondary">
        {document.content}
      </div>
    </article>
  );
}
