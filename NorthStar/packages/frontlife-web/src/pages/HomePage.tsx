import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PenLine, MessageSquare, BookOpen, Package, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { FEED, getUser, getArticle, getKB, TAG_LABELS } from '@/data/mock';
import FeedSkeleton, { FeedSkeletonList } from '@/components/FeedSkeleton';
import type { FeedItem, FeedPost, FeedArticleUpdate, FeedKBUpdate } from '@/types';

const PAGE_SIZE = 5;

export default function HomePage() {
  const navigate = useNavigate();
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const setShowCreateMenu = useAppStore((s) => s.setShowCreateMenu);

  // Sort feed by activity time (desc)
  const sortedFeed = useMemo(() => {
    return [...FEED].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }, []);

  const fetchData = useCallback(
    async (page: number) => {
      await new Promise((r) => setTimeout(r, 400));
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const items = sortedFeed.slice(start, end);
      return { items, hasMore: end < sortedFeed.length };
    },
    [sortedFeed]
  );

  const { items, initialLoading, loading, hasMore, loaderRef } =
    useInfiniteFeed<FeedItem>({ fetchData });

  return (
    <div className="mx-auto max-w-content-max px-5">
      {/* Hero */}
      <div className="py-10 text-center md:py-12">
        <div className="mx-auto max-w-xl">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              readOnly
              onClick={() => setShowSearch(true)}
              placeholder="图书馆几点关门？食堂哪最好吃？"
              className="h-[52px] w-full cursor-pointer rounded-lg border-[1.5px] border-border bg-white pl-11 pr-5 text-[15px] text-ink outline-none transition-all placeholder:text-ink-faint hover:border-ink-faint focus:border-sage focus:shadow-[0_4px_20px_rgba(74,124,89,0.12)]"
            />
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-xs text-ink-faint">
              从知识库中查找，找不到再问 AI
            </span>
            <button
              onClick={() => setShowCreateMenu(true)}
              className="flex items-center gap-1 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-ink-muted transition-all hover:border-sage hover:bg-sage-light hover:text-sage"
            >
              <PenLine size={13} />
              写点什么
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="pb-24 md:mx-auto md:max-w-reader-max">
        {initialLoading && <FeedSkeletonList count={3} />}

        {!initialLoading &&
          items.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              className="animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              {item.type === 'post' && <PostCard post={item.data as FeedPost} />}
              {item.type === 'article' && (
                <ArticleCard data={item.data as FeedArticleUpdate} />
              )}
              {item.type === 'kb' && <KBCard data={item.data as FeedKBUpdate} />}
            </div>
          ))}

        {loading && !initialLoading && <FeedSkeleton />}

        {!initialLoading && !hasMore && items.length > 0 && (
          <div className="py-8 text-center text-xs text-ink-faint">
            已经到底了
          </div>
        )}

        <div ref={loaderRef} className="h-4" />
      </div>
    </div>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const navigate = useNavigate();
  const u = getUser(post.authorId);

  return (
    <button
      onClick={() => navigate(`/post/${post.id}`)}
      className="mb-3 w-full rounded-lg border border-border-light bg-surface p-5 text-left transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-sage-light px-2.5 py-0.5 text-[11px] font-semibold text-sage">
          <MessageSquare size={11} />
          帖子
        </span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: u.color }}
        >
          {u.name[0]}
        </div>
        <span className="text-[13px] font-medium text-ink-secondary">
          {u.name}
        </span>
        <span className="text-xs text-ink-faint">· {post.time}</span>
      </div>

      <p className="text-[17px] font-medium leading-relaxed text-ink">
        {post.content}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {post.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-muted"
          >
            {TAG_LABELS[t]}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {post.replies.length}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {post.views}
        </span>
      </div>
    </button>
  );
}

function ArticleCard({ data }: { data: FeedArticleUpdate }) {
  const navigate = useNavigate();
  const article = getArticle(data.articleId);
  const kb = getKB(data.kbId);
  const u = getUser(data.updatedBy);
  if (!article || !kb) return null;

  return (
    <button
      onClick={() => navigate(`/kb/${data.kbId}/${data.articleId}`)}
      className="mb-3 w-full rounded-lg border border-border-light bg-surface p-5 text-left transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-light px-2.5 py-0.5 text-[11px] font-semibold text-blue-custom">
          <BookOpen size={11} />
          文章更新
        </span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: u.color }}
        >
          {u.name[0]}
        </div>
        <span className="text-[13px] font-medium text-ink-secondary">
          {u.name}
        </span>
        <span className="text-xs text-ink-faint">· {data.time}</span>
      </div>

      <h3 className="font-display text-[17px] font-bold leading-relaxed text-ink">
        {article.title}
      </h3>

      <div className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
        <Package size={12} />
        {kb.name}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {article.views}
        </span>
        <span className="rounded-full bg-sage-light px-2.5 py-0.5 text-[11px] text-sage">
          ✓ 确认于{article.confirmedAgo}
        </span>
      </div>
    </button>
  );
}

function KBCard({ data }: { data: FeedKBUpdate }) {
  const navigate = useNavigate();
  const kb = getKB(data.kbId);
  const u = getUser(data.updatedBy);
  if (!kb) return null;

  return (
    <button
      onClick={() => navigate(`/kb/${data.kbId}`)}
      className="mb-3 w-full rounded-lg border border-border-light bg-surface p-5 text-left transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-light px-2.5 py-0.5 text-[11px] font-semibold text-amber-custom">
          <Package size={11} />
          知识库更新
        </span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: u.color }}
        >
          {u.name[0]}
        </div>
        <span className="text-[13px] font-medium text-ink-secondary">
          {u.name}
        </span>
        <span className="text-xs text-ink-faint">· {data.time}</span>
      </div>

      <p className="text-[17px] font-medium leading-relaxed text-ink">
        {kb.name} 更新了「{data.newArticle}」
      </p>

      <div className="mt-3 text-xs text-ink-faint">
        <BookOpen size={12} className="mr-1 inline" />
        {kb.articles.length} 篇文章
      </div>
    </button>
  );
}
