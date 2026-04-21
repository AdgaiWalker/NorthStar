import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Eye } from 'lucide-react';
import { getUser, TAG_LABELS, POSTS } from '@/data/mock';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export default function PostPreviewModal() {
  const navigate = useNavigate();
  const showPostPreview = useAppStore((s) => s.showPostPreview);
  const previewPostId = useAppStore((s) => s.previewPostId);
  const setShowPostPreview = useAppStore((s) => s.setShowPostPreview);
  const userPosts = useAppStore((s) => s.userPosts);

  const allPosts = [...userPosts, ...POSTS];
  const post = allPosts.find((p) => p.id === previewPostId);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPostPreview(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowPostPreview]);

  if (!showPostPreview || !post) return null;

  const u = getUser(post.authorId);

  const openDetail = () => {
    setShowPostPreview(false);
    navigate(`/post/${post.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setShowPostPreview(false)}
    >
      <div
        className="mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-lg animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-light px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: u.color }}
            >
              {u.name[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">{u.name}</div>
              <div className="text-[11px] text-ink-faint">{post.time}</div>
            </div>
          </div>
          <button
            onClick={() => setShowPostPreview(false)}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink-muted"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.content}
          </p>

          {post.images && post.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {post.images.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'overflow-hidden rounded-lg border border-border-light',
                    post.images!.length === 1 && 'col-span-2',
                    post.images!.length === 3 && idx === 0 && 'col-span-2'
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                >
                  {TAG_LABELS[t]}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-faint">
              <span className="flex items-center gap-1">
                <MessageSquare size={12} /> {post.replies.length}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} /> {post.views}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-light px-5 py-3.5">
          <button
            onClick={openDetail}
            className="w-full rounded-lg bg-sage py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
          >
            查看全部评论
          </button>
        </div>
      </div>
    </div>
  );
}
