import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronDown, MessageCircle, Search, Sparkles } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/LoadingState';
import { api, type SearchResponse } from '@/services/api';

type SearchMode = 'exact' | 'partial' | 'empty';

export default function SearchResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setAiAnswer('');
    setAiOpen(false);

    api
      .search(query)
      .then((result) => {
        if (!cancelled) setSearchResult(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '搜索失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  const result = useMemo(() => {
    const articles = searchResult?.articles ?? [];
    const posts = searchResult?.posts ?? [];
    const spaces = searchResult?.spaces ?? [];
    if (articles.length > 0) return { mode: 'exact' as SearchMode, articles, posts, spaces };
    if (posts.length > 0 || spaces.length > 0) return { mode: 'partial' as SearchMode, articles, posts, spaces };
    return { mode: 'empty' as SearchMode, articles, posts, spaces };
  }, [searchResult]);

  useEffect(() => {
    if (!query || loading || error) return;
    api.recordSearchLog({
      query,
      resultCount: result.articles.length + result.posts.length + result.spaces.length,
      usedAi: result.mode === 'empty',
    }).catch(() => undefined);
    if (result.mode === 'empty') {
      setAiOpen(true);
    }
  }, [error, loading, query, result.mode]);

  useEffect(() => {
    if (!aiOpen || !query) return;
    let cancelled = false;

    async function run() {
      setAiLoading(true);
      try {
        await api.searchAiStream(query, (delta) => {
          if (!cancelled) {
            setAiAnswer((current) => current + delta);
          }
        });
      } catch (err) {
        if (!cancelled) {
          setAiAnswer(err instanceof Error ? err.message : 'AI 回答生成失败');
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [aiOpen, query]);

  if (!query) {
    return (
      <div className="mx-auto max-w-reader-max px-5 py-8">
        <ErrorState message="请先输入搜索关键词。" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content-max overflow-x-hidden px-4 py-8 sm:px-5">
      <div className="mb-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
          <Search size={20} />
        </div>
        <h1 className="break-words font-display text-[26px] font-bold leading-tight text-ink">搜索：{query}</h1>
        <p className="mt-2 text-sm leading-7 text-ink-muted">
          本地已确认内容优先展示，AI 回答只作为补充。
        </p>
      </div>

      {loading && <LoadingState label="正在搜索本地内容..." />}
      {!loading && error && (
        <ErrorState
          title="搜索失败"
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
          onBack={() => navigate('/')}
          backLabel="返回首页"
        />
      )}
      {!loading && !error && (
        <div className="space-y-4">
          {result.mode === 'empty' && (
            <EmptyState
              title="暂无本地结果"
              description="没有找到已确认文章、空间或同学动态。下面可以查看 AI 的补充回答。"
            />
          )}
          {(result.articles.length > 0 || result.posts.length > 0 || result.spaces.length > 0) && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-ink-secondary">
                {result.mode === 'exact' ? '找到直接匹配' : '找到相关内容'}
              </div>
              {result.articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="block rounded-2xl border border-border-light bg-surface p-5 transition-all hover:border-sage hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
                    <BookOpen size={14} className="text-sage" />
                    {article.helpfulCount} 人确认
                  </div>
                  <div className="break-words font-display text-[18px] font-bold leading-6 text-ink">{article.title}</div>
                  <p className="mt-2 break-words text-sm leading-6 text-ink-muted md:line-clamp-2">{article.summary}</p>
                </Link>
              ))}
              {result.posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/space/${post.spaceId}`}
                  className="block rounded-2xl border border-border-light bg-surface p-5 transition-all hover:border-sage hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
                    <MessageCircle size={14} className="text-sage" />
                    {post.author.name}
                  </div>
                  <p className="break-words text-[15px] leading-7 text-ink">{post.content}</p>
                </Link>
              ))}
              {result.spaces.map((space) => (
                <Link
                  key={space.id}
                  to={`/space/${space.id}`}
                  className="block rounded-2xl border border-border-light bg-surface p-5 transition-all hover:border-sage hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
                    <BookOpen size={14} className="text-sage" />
                    {space.articleCount} 篇文章
                  </div>
                  <div className="break-words font-display text-[18px] font-bold leading-6 text-ink">{space.title}</div>
                  <p className="mt-2 break-words text-sm leading-6 text-ink-muted md:line-clamp-2">{space.description}</p>
                </Link>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border-light bg-surface p-5">
            <button
              onClick={() => setAiOpen((value) => !value)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
                <Sparkles size={15} className="text-sage" />
                由 AI 生成，仅供参考
              </span>
              <ChevronDown size={16} className={aiOpen ? 'rotate-180 text-sage' : 'text-ink-faint'} />
            </button>

            {aiOpen && (
              <div className="mt-4 min-h-20 break-words rounded-xl bg-bg-subtle p-4 text-sm leading-7 text-ink-secondary">
                {aiAnswer}
                {aiLoading && <span className="ml-1 animate-pulse text-sage">▋</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
