import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, Globe, LoaderCircle, Newspaper } from 'lucide-react';
import type { CompassNewsRecord, Domain } from '@ns/shared';
import { compassApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

const domainLabels: Record<Domain, string> = { creative: '创意', dev: '开发', work: '办公' };
const domainColors: Record<Domain, string> = {
  creative: 'bg-purple-50 text-purple-700',
  dev: 'bg-blue-50 text-blue-700',
  work: 'bg-green-50 text-green-700',
};

export const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';
  const [items, setItems] = useState<CompassNewsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDomain, setFilterDomain] = useState<Domain | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    compassApi
      .listNews()
      .then((result) => {
        if (!cancelled) setItems(result.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = filterDomain === 'all' ? items : items.filter((n) => n.domain === filterDomain);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isEyeCare ? 'text-stone-900' : 'text-slate-900'}`}>AI 前沿资讯</h1>
        <p className="mt-2 text-slate-500">全球 AI 领域最新动态与趋势</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'creative', 'dev', 'work'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setFilterDomain(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterDomain === d
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d === 'all' ? '全部' : domainLabels[d]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <LoaderCircle className="animate-spin mr-2" size={20} />
          加载中...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-20 text-center text-slate-400">
          <Newspaper size={48} className="mx-auto mb-4 opacity-20" />
          <p>暂无资讯</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((news) => (
            <article
              key={news.id}
              className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                isEyeCare ? 'border-stone-200 bg-[#FDFCF8]' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${domainColors[news.domain]}`}>
                      {domainLabels[news.domain]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Globe size={10} />
                      {news.source}
                    </span>
                  </div>
                  <h2 className={`text-lg font-semibold leading-snug ${isEyeCare ? 'text-stone-900' : 'text-slate-900'}`}>
                    {news.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">{news.summary}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(news.publishedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                {news.url && (
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-600"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
