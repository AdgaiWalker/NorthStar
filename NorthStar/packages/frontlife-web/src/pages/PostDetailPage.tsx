import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Eye, Star } from 'lucide-react';
import { POSTS, getUser, TAG_LABELS } from '@/data/mock';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const userPosts = useAppStore((s) => s.userPosts);
  const allPosts = useMemo(() => [...userPosts, ...POSTS], [userPosts]);
  const post = allPosts.find((p) => p.id === postId);
  const [replies, setReplies] = useState(post?.replies ?? []);
  const [replyText, setReplyText] = useState('');
  const [starred, setStarred] = useState<Record<string, boolean>>({});

  if (!post) {
    return (
      <div className="px-5 py-20 text-center text-ink-muted">帖子不存在</div>
    );
  }

  const u = getUser(post.authorId);

  const sendReply = () => {
    if (!replyText.trim()) return;
    setReplies([
      ...replies,
      {
        id: 'r' + Date.now(),
        authorId: 'zhang',
        time: '刚刚',
        text: replyText,
        stars: 0,
      },
    ]);
    setReplyText('');
  };

  const toggleStar = (rid: string) => {
    setStarred((prev) => ({ ...prev, [rid]: !prev[rid] }));
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-5"
    >
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-sage"
      >
        <ArrowLeft size={14} /> 返回
      </button>

      {/* Post Card */}
      <div className="rounded-lg border border-border-light bg-surface p-6"
      >
        <div className="mb-4 flex items-center gap-2.5"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: u.color }}
          >
            {u.name[0]}
          </div>
          <div>
            <div className="text-sm font-semibold"
            >{u.name}</div>
            <div className="text-xs text-ink-faint"
            >{post.time}</div>
          </div>
        </div>

        <p className="text-base leading-relaxed text-ink"
        >{post.content}</p>

        {post.images && post.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2"
          >
            {post.images.map((img, idx) => (
              <div
                key={idx}
                className={cn(
                  'overflow-hidden rounded-lg border border-border-light',
                  post.images!.length === 1 && 'col-span-2',
                  post.images!.length === 3 && idx === 0 && 'col-span-2'
                )}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3"
        >
          <div className="flex gap-1.5"
          >
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-muted"
              >
                {TAG_LABELS[t]}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-ink-faint"
          >
            <span className="flex items-center gap-1"
            >
              <MessageSquare size={12} /> {replies.length}
            </span>
            <span className="flex items-center gap-1"
            >
              <Eye size={12} /> {post.views}
            </span>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="mt-5 overflow-hidden rounded-lg border border-border-light bg-surface"
      >
        <div className="border-b border-border-light px-5 py-4 font-display text-[15px] font-bold"
        >
          回复 ({replies.length})
        </div>
        {replies.map((r) => {
          const ru = getUser(r.authorId);
          const isStarred = starred[r.id];
          return (
            <div key={r.id} className="border-b border-border-light px-5 py-3.5 last:border-b-0"
            >
              <div className="mb-1 flex items-center gap-2 text-[13px] font-medium"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: ru.color }}
                >
                  {ru.name[0]}
                </div>
                {ru.name} · {r.time}
              </div>
              <p className="text-sm leading-relaxed text-ink"
              >{r.text}</p>
              <button
                onClick={() => toggleStar(r.id)}
                className={`mt-2 flex items-center gap-1 text-xs transition-colors ${isStarred ? 'text-amber-custom' : 'text-ink-faint hover:text-amber-custom'}`}
              >
                <Star size={12} fill={isStarred ? 'currentColor' : 'none'} />
                {r.stars + (isStarred ? 1 : 0)}
              </button>
            </div>
          );
        })}

        {/* Reply Input */}
        <div className="flex gap-2 border-t border-border-light px-5 py-3"
        >
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendReply()}
            placeholder="写回复..."
            className="h-9 flex-1 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-sage"
          />
          <button
            onClick={sendReply}
            className="rounded-lg bg-sage px-4 text-[13px] font-medium text-white transition-colors hover:bg-sage-dark"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
