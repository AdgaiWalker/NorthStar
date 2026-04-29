import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronDown, CircleHelp, ExternalLink, MessageCircle, PenLine, Search, Sparkles } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/LoadingState';
import { api, type SearchResponse } from '@/services/api';
import { useUserStore } from '@/store/useUserStore';

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
  const token = useUserStore((state) => state.token);
  const canPost = useUserStore((state) => state.permissions.canPost);

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

  const openHelpComposer = () => {
    if (!token) {
      navigate('/login');
      return;
    }

    navigate(`/?write=1&tag=help&q=${encodeURIComponent(query)}`);
  };

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
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="mb-4">
                <EmptyState
                  title="暂无本地结果"
                  description="没有找到已确认文章、空间或同学动态。AI 只能给参考建议，不会替校园事实作断言。"
                />
              </div>
              <div className="rounded-xl border border-sage-light bg-sage-light p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sage">
                    <CircleHelp size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-sage-dark">把这个问题发给同学和维护者</div>
                    <p className="mt-1 break-words text-sm leading-6 text-ink-muted">
                      会预填为“我想问：{query}”，并作为求助帖进入生活流。
                    </p>
                    <button
                      onClick={openHelpComposer}
                      disabled={Boolean(token) && !canPost}
                      className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sage px-4 text-sm font-medium text-white transition-colors hover:bg-sage-dark disabled:bg-ink-faint"
                    >
                      <PenLine size={15} />
                      {token ? '发起求助' : '登录后发起求助'}
                    </button>
                    {token && !canPost && (
                      <div className="mt-2 text-xs leading-5 text-ink-muted">当前账号暂未开放发帖能力。</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              <div className="mt-4 space-y-3">
                <div className="min-h-20 break-words rounded-xl bg-bg-subtle p-4 text-sm leading-7 text-ink-secondary">
                  {aiAnswer}
                  {aiLoading && <span className="ml-1 animate-pulse text-sage">▋</span>}
                </div>
                {result.mode === 'empty' && (
                  <button
                    onClick={openHelpComposer}
                    disabled={Boolean(token) && !canPost}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border-light px-3 text-xs font-medium text-ink-secondary hover:border-sage hover:text-sage disabled:text-ink-faint"
                  >
                    <PenLine size={14} />
                    我知道准确信息，来补充
                  </button>
                )}
                <a
                  href="https://xyzidea.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-sage"
                >
                  想了解更多 AI 工具？
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
