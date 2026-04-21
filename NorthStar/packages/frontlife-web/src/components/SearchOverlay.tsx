import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ARTICLES, POSTS, getArticle, getKB } from '@/data/mock';
import { aiSearch } from '@/services/AIService';
import type { ArticleData } from '@/data/mock';
import type { FeedPost } from '@/types';

interface SearchResult {
  type: 'article' | 'post' | 'ai';
  title: string;
  id: string;
  kbId?: string;
  content?: string;
}

export default function SearchOverlay() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const navigate = useNavigate();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setAiError('');
      return;
    }
    setLoading(true);
    setAiError('');

    await new Promise((r) => setTimeout(r, 300));

    const r: SearchResult[] = [];
    Object.values(ARTICLES).forEach((a: ArticleData) => {
      if (a.title.includes(q) || a.content.includes(q)) {
        r.push({ type: 'article', title: a.title, id: a.id, kbId: a.kbId });
      }
    });
    POSTS.forEach((p: FeedPost) => {
      if (p.content.includes(q)) {
        r.push({ type: 'post', title: p.content, id: p.id });
      }
    });

    setResults(r);
    setLoading(false);

    // 本地无结果时自动调用 AI
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(v), 400);
  };

  const handleResultClick = (r: SearchResult) => {
    setShowSearch(false);
    if (r.type === 'article' && r.kbId) {
      navigate(`/kb/${r.kbId}/${r.id}`);
    } else {
      navigate(`/post/${r.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-bg pt-nav-h">
      {/* Header */}
      <div className="mx-auto w-full max-w-2xl px-5 pt-4">
        <button
          onClick={() => setShowSearch(false)}
          className="mb-3 flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-sage"
        >
          <ArrowLeft size={14} /> 返回
        </button>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            autoFocus
            value={query}
            onChange={handleChange}
            placeholder="搜索知识库、文章、帖子..."
            className="h-12 w-full rounded-lg border border-border bg-white pl-11 pr-4 text-[15px] text-ink outline-none transition-all focus:border-sage focus:ring-2 focus:ring-sage-light"
          />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto mt-4 w-full max-w-2xl flex-1 overflow-y-auto px-5 pb-10">
        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
            <Search size={40} className="mb-4 opacity-30" />
            <p className="text-sm leading-relaxed text-center">
              输入关键词搜索知识库内容
              <br />
              找不到会自动问 AI
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center gap-1.5 py-8">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-ink-faint"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}

        {/* AI Loading */}
        {aiLoading && (
          <div className="flex items-center gap-2 py-6 text-ink-muted">
            <Sparkles size={16} className="animate-pulse text-sage" />
            <span className="text-sm">AI 正在帮你搜索...</span>
          </div>
        )}

        {/* AI Error */}
        {aiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <p>{aiError}</p>
            <button
              onClick={() => doSearch(query)}
              className="mt-2 text-xs font-medium text-red-500 underline hover:text-red-700"
            >
              重试
            </button>
          </div>
        )}

        {/* No local results — AI will auto-trigger, show waiting hint */}
        {!loading && !aiLoading && query && results.length === 0 && !aiError && (
          <div className="py-16 text-center text-ink-muted">
            <p>未找到相关内容</p>
            <p className="mt-2 text-xs">正在询问 AI...</p>
          </div>
        )}

        {/* Results list */}
        <div className="space-y-2">
          {results.map((r, i) =>
            r.type === 'ai' ? (
              <div
                key={i}
                className="w-full rounded-lg border border-sage-light bg-sage-light/40 p-4 text-left"
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
                className="w-full rounded-lg border border-border-light bg-surface p-4 text-left transition-all hover:border-border hover:shadow-md"
              >
                <div className="mb-1.5 text-xs text-ink-muted">
                  {r.type === 'article' ? '📖 文章' : '💬 帖子'}
                </div>
                <div className="text-[15px] font-medium text-ink line-clamp-2">
                  {r.title}
                </div>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
