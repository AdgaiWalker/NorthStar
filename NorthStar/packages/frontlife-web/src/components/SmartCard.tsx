import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Eye, Bookmark, Clock } from 'lucide-react';
import { getUser, getArticle, getKB, TAG_LABELS } from '@/data/mock';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/types';

interface SmartCardProps {
  item: FeedItem;
  index?: number;
}

export default function SmartCard({ item, index = 0 }: SmartCardProps) {
  const navigate = useNavigate();
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // Determine card status based on activity time
  const hoursAgo = (Date.now() - item.lastActivityAt) / (1000 * 60 * 60);
  const isFresh = hoursAgo < 24;
  const isStale = hoursAgo > 24 * 7;

  const handleClick = () => {
    if (item.type === 'post') {
      navigate(`/post/${item.data.id}`);
    } else if (item.type === 'article') {
      navigate(`/kb/${item.data.kbId}/${item.data.articleId}`);
    } else {
      navigate(`/kb/${item.data.kbId}`);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id =
      item.type === 'post'
        ? item.data.id
        : item.type === 'article'
          ? item.data.articleId
          : item.data.kbId;
    toggleBookmark(id);
  };

  // Build card content based on type
  let authorName = '';
  let authorColor = '#999';
  let title = '';
  let body = '';
  let meta: { icon: React.ReactNode; text: string }[] = [];
  let tags: string[] = [];
  let images: string[] | undefined;
  let cardId = '';
  let kbName = '';

  if (item.type === 'post') {
    const post = item.data;
    const u = getUser(post.authorId);
    authorName = u.name;
    authorColor = u.color;
    title = '';
    body = post.content;
    tags = post.tags;
    images = post.images;
    cardId = post.id;
    const kb = getKB(post.kbId);
    kbName = kb?.name || '';
    meta = [
      { icon: <MessageSquare size={11} />, text: `${post.replies.length}` },
      { icon: <Eye size={11} />, text: `${post.views}` },
    ];
  } else if (item.type === 'article') {
    const data = item.data;
    const article = getArticle(data.articleId);
    const u = getUser(data.updatedBy);
    const kb = getKB(data.kbId);
    authorName = u.name;
    authorColor = u.color;
    title = article?.title || '';
    body = article?.content.slice(0, 120) + '...' || '';
    cardId = data.articleId;
    kbName = kb?.name || '';
    meta = [
      { icon: <Eye size={11} />, text: `${article?.views || 0}` },
      { icon: <Clock size={11} />, text: article?.confirmedAgo || '' },
    ];
  } else {
    const data = item.data;
    const kb = getKB(data.kbId);
    const u = getUser(data.updatedBy);
    authorName = u.name;
    authorColor = u.color;
    title = `${kb?.name || ''} 更新了「${data.newArticle}」`;
    body = kb?.desc || '';
    cardId = data.kbId;
    kbName = kb?.name || '';
    meta = [
      { icon: <MessageSquare size={11} />, text: `${kb?.articles.length || 0} 篇` },
    ];
  }

  const isBookmarked = bookmarks[cardId];

  // Card border color based on status
  const borderClass = isBookmarked
    ? 'border-sage bg-sage-light/40'
    : isFresh
      ? 'border-sage/40'
      : isStale
        ? 'border-border-light/60'
        : 'border-border-light';

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group mb-4 w-full cursor-pointer rounded-2xl border bg-surface p-5 text-left transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        borderClass
      )}
      style={{
        animationDelay: `${Math.min(index, 8) * 60}ms`,
      }}
    >
      {/* Author row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: authorColor }}
          >
            {authorName[0]}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">{authorName}</span>
            {kbName && (
              <span className="text-[11px] text-ink-faint">· {kbName}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleBookmark}
          className={cn(
            'rounded-full p-1.5 transition-colors',
            isBookmarked
              ? 'text-sage'
              : 'text-ink-faint opacity-0 group-hover:opacity-100 hover:text-sage'
          )}
        >
          <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Title (for articles/kb updates) */}
      {title && (
        <h3 className="mb-2 font-display text-[17px] font-bold leading-relaxed text-ink">
          {title}
        </h3>
      )}

      {/* Body content */}
      {body && (
        <p
          className={cn(
            'leading-relaxed text-ink-secondary',
            title ? 'text-[14px]' : 'text-[16px] font-medium text-ink'
          )}
        >
          {body}
        </p>
      )}

      {/* Images */}
      {images && images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {images.slice(0, 3).map((img, idx) => (
            <div
              key={idx}
              className={cn(
                'aspect-square overflow-hidden rounded-lg',
                images!.length === 1 && 'col-span-3 aspect-video'
              )}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-bg-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted"
            >
              {TAG_LABELS[t]}
            </span>
          ))}
        </div>
      )}

      {/* Meta footer */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-faint">
        {meta.map((m, i) => (
          <span key={i} className="flex items-center gap-1">
            {m.icon}
            {m.text}
          </span>
        ))}
        {isFresh && (
          <span className="ml-auto flex items-center gap-1 text-sage">
            <Sparkles size={11} />
            新鲜
          </span>
        )}
      </div>
    </div>
  );
}
