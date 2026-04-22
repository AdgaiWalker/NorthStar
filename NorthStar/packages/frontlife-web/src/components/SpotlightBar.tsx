import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sparkles, Send, X, ImagePlus, BookOpen } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { ARTICLES, POSTS, KNOWLEDGE_BASES, getArticle, getKB } from '@/data/mock';
import { aiSearch } from '@/services/AIService';
import type { ArticleData } from '@/data/mock';
import type { PostTag } from '@/types';

const TAG_OPTIONS: { tag: PostTag; label: string }[] = [
  { tag: 'share', label: '#分享' },
  { tag: 'help', label: '#求助' },
  { tag: 'secondhand', label: '#二手' },
  { tag: 'event', label: '#活动' },
  { tag: 'discussion', label: '#讨论' },
];

interface SearchResult {
  type: 'article' | 'post' | 'ai';
  title: string;
  id: string;
  kbId?: string;
  content?: string;
}

export default function SpotlightBar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'share'>('share');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [selectedTags, setSelectedTags] = useState<PostTag[]>([]);
  const [selectedKb, setSelectedKb] = useState('freeboard');
  const [images, setImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const addPost = useAppStore((s) => s.addPost);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const r: SearchResult[] = [];
    Object.values(ARTICLES).forEach((a: ArticleData) => {
      if (a.title.includes(q) || a.content.includes(q)) {
        r.push({ type: 'article', title: a.title, id: a.id, kbId: a.kbId });
      }
    });
    POSTS.forEach((p) => {
      if (p.content.includes(q)) {
        r.push({ type: 'post', title: p.content, id: p.id });
      }
    });
    setResults(r);

    if (r.length === 0) {
      setAiLoading(true);
      try {
        const articleCtx = Object.values(ARTICLES).slice(0, 10).map((a: ArticleData) => ({
          title: a.title,
          summary: a.content.slice(0, 200),
        }));
        const aiRes = await aiSearch(q, articleCtx);
        setResults([{ type: 'ai', title: 'AI 回答', id: 'ai', content: aiRes.answer }]);
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'AI 服务暂时不可用');
      } finally {
        setAiLoading(false);
      }
    }
  }, []);

  // Only show on home page
  if (!isHome && !expanded) return null;

  const openExpanded = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeExpanded = () => {
    setExpanded(false);
    setQuery('');
    setResults([]);
    setAiError('');
    setImages([]);
    setSelectedTags([]);
  };

  const detectMode = (text: string): 'search' | 'share' => {
    const trimmed = text.trim();
    if (trimmed.endsWith('?') || trimmed.endsWith('？')) return 'search';
    if (trimmed.length < 15 && trimmed.length > 0) return 'search';
    return 'share';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setQuery(v);
    const detected = detectMode(v);
    setMode(detected);
    if (detected === 'search' && v.trim().length > 1) {
      doSearch(v);
    } else {
      setResults([]);
      setAiError('');
    }
  };

  const handleResultClick = (r: SearchResult) => {
    closeExpanded();
    if (r.type === 'article' && r.kbId) {
      navigate(`/kb/${r.kbId}/${r.id}`);
    } else {
      navigate(`/post/${r.id}`);
    }
  };

  const handlePublish = () => {
    if (!query.trim() || mode !== 'share') return;
    setPublishing(true);
    const newPost = {
      id: `p-${Date.now()}`,
      authorId: 'zhang',
      time: '刚刚',
      content: query.trim(),
      tags: selectedTags.length > 0 ? selectedTags : (['share'] as PostTag[]),
      saves: 0,
      views: 0,
      replies: [],
      images: images.length > 0 ? images : undefined,
      kbId: selectedKb,
    };
    addPost(newPost);
    setTimeout(() => {
      closeExpanded();
      setPublishing(false);
      navigate('/');
    }, 300);
  };

  const toggleTag = (tag: PostTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 4 - images.length;
    const toProcess = Array.from(files).slice(0, remainingSlots);
    toProcess.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const canPublish = mode === 'share' && query.trim().length > 0 && !publishing;

  return (
    <>
      {/* Collapsed bar - only on home page, mobile only */}
      {!expanded && isHome && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border-light bg-white/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2.5 backdrop-blur-md md:hidden">
          <button
            onClick={openExpanded}
            className="flex h-12 w-full items-center gap-3 rounded-2xl border border-border-light bg-bg-subtle px-4 text-left transition-all active:scale-[0.98]"
          >
            <Sparkles size={16} className="text-sage" />
            <span className="text-[14px] text-ink-faint">
              问点什么，或者分享点什么
            </span>
          </button>
        </div>
      )}

      {/* Expanded overlay */}
      {expanded && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-in fade-in duration-200 md:items-center md:justify-center md:bg-black/30 md:backdrop-blur-sm">
          <div className="flex h-full w-full flex-col bg-white md:h-auto md:max-h-[80vh] md:max-w-xl md:rounded-2xl md:shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
              <button
                onClick={closeExpanded}
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink-muted"
              >
                <X size={18} />
              </button>
              <span className="text-sm font-medium text-ink-secondary">
                {mode === 'search' ? '搜索' : '分享'}
              </span>
              <div className="w-8" />
            </div>

            {/* Input area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <textarea
                ref={inputRef as any}
                value={query}
                onChange={handleInputChange}
                placeholder="问点什么，或者分享点什么"
                className="h-32 w-full resize-none bg-transparent text-[17px] leading-relaxed text-ink outline-none placeholder:text-ink-faint"
              />

              {/* Images preview */}
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border-light">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Share mode options */}
              {mode === 'share' && (
                <>
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium text-ink-muted">标签</div>
                    <div className="flex flex-wrap gap-2">
                      {TAG_OPTIONS.map((opt) => {
                        const active = selectedTags.includes(opt.tag);
                        return (
                          <button
                            key={opt.tag}
                            onClick={() => toggleTag(opt.tag)}
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                              active
                                ? 'border-sage bg-sage-light text-sage'
                                : 'border-border bg-white text-ink-muted hover:border-ink-faint'
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium text-ink-muted">发布到</div>
                    <div className="relative">
                      <select
                        value={selectedKb}
                        onChange={(e) => setSelectedKb(e.target.value)}
                        className="h-9 w-full appearance-none rounded-lg border border-border bg-bg-subtle pl-8 pr-6 text-sm text-ink outline-none focus:border-sage"
                      >
                        {Object.values(KNOWLEDGE_BASES).map((kb) => (
                          <option key={kb.id} value={kb.id}>
                            {kb.name}
                          </option>
                        ))}
                      </select>
                      <BookOpen size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    </div>
                  </div>

                  {images.length < 4 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-white px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:border-sage hover:text-sage"
                    >
                      <ImagePlus size={14} />
                      添加图片 {images.length > 0 && `(${images.length}/4)`}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}

              {/* Search results */}
              {mode === 'search' && (
                <div className="mt-4 space-y-2">
                  {aiLoading && (
                    <div className="flex items-center gap-2 py-4 text-ink-muted">
                      <Sparkles size={16} className="animate-pulse text-sage" />
                      <span className="text-sm">AI 正在帮你搜索...</span>
                    </div>
                  )}
                  {aiError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {aiError}
                    </div>
                  )}
                  {results.map((r, i) =>
                    r.type === 'ai' ? (
                      <div
                        key={i}
                        className="w-full rounded-xl border border-sage-light bg-sage-light/30 p-4 text-left"
                      >
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-sage">
                          <Sparkles size={13} />
                          AI 回答
                        </div>
                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                          {r.content}
                        </div>
                      </div>
                    ) : (
                      <button
                        key={i}
                        onClick={() => handleResultClick(r)}
                        className="w-full rounded-xl border border-border-light bg-surface p-4 text-left transition-all hover:border-border hover:shadow-sm"
                      >
                        <div className="mb-1 text-xs text-ink-muted">
                          {r.type === 'article' ? '📖 文章' : '💬 帖子'}
                        </div>
                        <div className="text-[15px] font-medium text-ink line-clamp-2">
                          {r.title}
                        </div>
                      </button>
                    )
                  )}
                  {!aiLoading && !aiError && query.trim().length > 1 && results.length === 0 && (
                    <div className="py-8 text-center text-sm text-ink-muted">
                      正在询问 AI...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="border-t border-border-light px-4 py-3">
              {mode === 'share' ? (
                <button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all',
                    canPublish ? 'bg-sage hover:bg-sage-dark' : 'cursor-not-allowed bg-ink-faint'
                  )}
                >
                  <Send size={15} />
                  {publishing ? '发布中...' : '发布'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  <Sparkles size={13} className="text-sage" />
                  输入问题自动搜索，无结果时 AI 会回答
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
