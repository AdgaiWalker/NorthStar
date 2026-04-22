import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Eye, BookOpen } from 'lucide-react';
import { getKB, getArticle, getKBPosts, getUser, TAG_LABELS } from '@/data/mock';
import { cn } from '@/lib/utils';
import KBIcon from '@/components/KBIcon';
import type { FeedPost } from '@/types';

interface KBSheetProps {
  kbId: string;
  onClose: () => void;
}

export default function KBSheet({ kbId, onClose }: KBSheetProps) {
  const navigate = useNavigate();
  const kb = getKB(kbId);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!kb) return null;

  const posts = getKBPosts(kb.id);
  const author = getUser(kb.authorId);

  // Combine articles and posts into a single stream
  const streamItems: (
    | { type: 'article'; id: string; title: string; time: string }
    | { type: 'post'; data: FeedPost }
  )[] = [];

  kb.articles.forEach((aid) => {
    const a = getArticle(aid);
    if (a) {
      streamItems.push({
        type: 'article',
        id: a.id,
        title: a.title,
        time: a.updatedAt,
      });
    }
  });

  posts.forEach((p) => {
    streamItems.push({ type: 'post', data: p });
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  const handleArticleClick = (articleId: string) => {
    onClose();
    navigate(`/kb/${kbId}/${articleId}`);
  };

  const handlePostClick = (postId: string) => {
    onClose();
    navigate(`/post/${postId}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${translateY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* KB Header */}
        <div className="px-5 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <KBIcon iconName={kb.iconName} size={32} withBg />
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  {kb.name}
                </h2>
                <p className="text-sm text-ink-muted">{kb.desc}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink-muted"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <BookOpen size={12} /> {kb.articles.length} 篇文章
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {posts.length} 条讨论
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {kb.views}
            </span>
          </div>
        </div>

        {/* Unified Stream */}
        <div className="flex-1 overflow-y-auto px-5 pb-6"
        >
          {streamItems.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-muted">
              该知识库暂无内容
            </div>
          )}

          <div className="space-y-3">
            {streamItems.map((item, i) =>
              item.type === 'article' ? (
                <button
                  key={`a-${i}`}
                  onClick={() => handleArticleClick(item.id)}
                  className="w-full rounded-xl border border-border-light bg-surface p-4 text-left transition-all hover:shadow-sm hover:border-border"
                >
                  <div className="mb-1.5 flex items-center gap-2"
>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-light px-2 py-0.5 text-[10px] font-medium text-blue-custom">
                      <BookOpen size={10} /> 文章
                    </span>
                    <span className="text-[11px] text-ink-faint">{item.time}</span>
                  </div>
                  <div className="text-[15px] font-semibold text-ink">{item.title}</div>
                </button>
              ) : (
                <button
                  key={`p-${item.data.id}`}
                  onClick={() => handlePostClick(item.data.id)}
                  className="w-full rounded-xl border border-border-light bg-surface p-4 text-left transition-all hover:shadow-sm hover:border-border"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ background: getUser(item.data.authorId).color }}
                    >
                      {getUser(item.data.authorId).name[0]}
                    </div>
                    <span className="text-[12px] font-medium text-ink-secondary">
                      {getUser(item.data.authorId).name}
                    </span>
                    <span className="text-[11px] text-ink-faint">· {item.data.time}</span>
                  </div>
                  <p className="line-clamp-2 text-[14px] leading-relaxed text-ink">
                    {item.data.content}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.data.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                      >
                        {TAG_LABELS[t]}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-faint">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} /> {item.data.replies.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={11} /> {item.data.views}
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
