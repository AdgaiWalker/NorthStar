import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Search } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/LoadingState';
import { api, type SpaceSummary } from '@/services/api';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .listSpaces()
      .then((result) => {
        if (!cancelled) setSpaces(result.spaces);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '空间加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-content-max px-5 py-8">
      <div className="mb-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
          <Compass size={20} />
        </div>
        <h1 className="font-display text-[26px] font-bold text-ink">探索</h1>
        <p className="mt-2 text-sm leading-7 text-ink-muted">浏览所有校园生活空间。</p>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索空间..."
          className="h-11 w-full rounded-xl border border-border bg-bg-subtle pl-10 pr-4 text-sm text-ink outline-none transition-colors focus:border-sage focus:bg-white"
        />
      </div>

      {loading && <LoadingState label="正在加载空间..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces
            .filter((space) => {
              const value = query.trim();
              if (!value) return true;
              return `${space.title}\n${space.description}\n${space.maintainer.name}`.includes(value);
            })
            .sort((a, b) => b.recentActiveAt.localeCompare(a.recentActiveAt))
            .map((space) => (
              <button
                key={space.id}
                onClick={() => navigate(`/space/${space.id}`)}
                className="min-w-0 rounded-2xl border border-border-light bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-sage hover:shadow-md"
              >
                <div className="break-words font-display text-[18px] font-bold text-ink">{space.title}</div>
                <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-ink-muted">{space.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
                  <span>{space.articleCount} 篇文章</span>
                  <span>{space.helpfulCount} 人确认</span>
                  <span>{new Date(space.recentActiveAt).toLocaleDateString()} 活跃</span>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
