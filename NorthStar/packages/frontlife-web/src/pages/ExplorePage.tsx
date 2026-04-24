import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, LoaderCircle, PlusCircle, Search } from 'lucide-react';
import { CAMPUS_CATEGORIES } from '@ns/shared';
import { EmptyState, ErrorState, LoadingState } from '@/components/LoadingState';
import { api, type SpaceSummary } from '@/services/api';
import { useUserStore } from '@/store/useUserStore';

export default function ExplorePage() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const canCreateSpace = useUserStore((state) => state.permissions.canCreateSpace);
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [spaceTitle, setSpaceTitle] = useState('');
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spaceCategory, setSpaceCategory] = useState(CAMPUS_CATEGORIES[0]?.slug ?? 'arrival');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createMessage, setCreateMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

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
  }, [reloadKey]);

  const visibleSpaces = spaces
    .filter((space) => {
      const value = query.trim();
      if (!value) return true;
      return `${space.title}\n${space.description}\n${space.maintainer.name}`.includes(value);
    })
    .sort((a, b) => b.recentActiveAt.localeCompare(a.recentActiveAt));

  const createSpace = async () => {
    if (!token) return navigate('/login');
    if (!spaceTitle.trim() || !spaceSlug.trim() || !spaceDescription.trim()) return;

    setCreateLoading(true);
    setCreateError('');
    setCreateMessage('');

    try {
      const result = await api.createSpace({
        title: spaceTitle.trim(),
        slug: normalizeSlug(spaceSlug),
        description: spaceDescription.trim(),
        category: spaceCategory,
      });
      setSpaces((current) => [result.space, ...current]);
      setCreateMessage('空间已创建');
      setCreateOpen(false);
      setSpaceTitle('');
      setSpaceSlug('');
      setSpaceDescription('');
      navigate(`/space/${result.space.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '空间创建失败，请稍后重试。');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-content-max px-5 py-8">
      <div className="mb-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
          <Compass size={20} />
        </div>
        <h1 className="font-display text-[26px] font-bold text-ink">探索</h1>
        <p className="mt-2 text-sm leading-7 text-ink-muted">浏览所有校园生活空间。</p>
      </div>

      {token && canCreateSpace && (
        <div className="mb-5 rounded-2xl border border-border-light bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink-secondary">创建空间</div>
              <div className="mt-1 text-xs leading-5 text-ink-muted">适合把一个稳定主题整理成文章和动态。</div>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen((value) => !value)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sage px-4 text-sm font-medium text-white"
            >
              <PlusCircle size={16} />
              {createOpen ? '收起' : '新建空间'}
            </button>
          </div>
          {createOpen && (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={spaceTitle}
                  onChange={(event) => {
                    setSpaceTitle(event.target.value);
                    if (!spaceSlug.trim()) setSpaceSlug(normalizeSlug(event.target.value));
                  }}
                  placeholder="空间名称，例如：社团活动"
                  className="h-11 rounded-xl border border-border bg-bg-subtle px-3 text-sm outline-none focus:border-sage focus:bg-white"
                />
                <input
                  value={spaceSlug}
                  onChange={(event) => setSpaceSlug(normalizeSlug(event.target.value))}
                  placeholder="空间标识，例如：club-events"
                  className="h-11 rounded-xl border border-border bg-bg-subtle px-3 text-sm outline-none focus:border-sage focus:bg-white"
                />
              </div>
              <select
                value={spaceCategory}
                onChange={(event) => setSpaceCategory(event.target.value)}
                className="h-11 rounded-xl border border-border bg-bg-subtle px-3 text-sm outline-none focus:border-sage focus:bg-white"
              >
                {CAMPUS_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <textarea
                value={spaceDescription}
                onChange={(event) => setSpaceDescription(event.target.value)}
                placeholder="说明这个空间要解决什么问题"
                className="h-24 resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm leading-6 outline-none focus:border-sage focus:bg-white"
              />
              {createError && <div className="text-sm text-rose-custom">{createError}</div>}
              <button
                type="button"
                disabled={createLoading || !spaceTitle.trim() || !spaceSlug.trim() || !spaceDescription.trim()}
                onClick={createSpace}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint sm:w-fit"
              >
                {createLoading && <LoaderCircle size={16} className="animate-spin" />}
                创建空间
              </button>
            </div>
          )}
          {createMessage && !createOpen && <div className="mt-3 text-sm text-sage">{createMessage}</div>}
        </div>
      )}

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
      {!loading && error && (
        <ErrorState title="空间加载失败" message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      )}
      {!loading && !error && (
        <>
          {visibleSpaces.length === 0 && (
            <EmptyState
              title={query.trim() ? '暂无匹配空间' : '暂无空间'}
              description={query.trim() ? '没有找到符合关键词的空间，可以换个关键词试试。' : '当前还没有可浏览的校园空间。'}
            />
          )}
          {visibleSpaces.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSpaces.map((space) => (
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
        </>
      )}
    </div>
  );
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}
