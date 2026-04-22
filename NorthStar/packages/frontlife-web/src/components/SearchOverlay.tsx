import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ARTICLES, POSTS, KNOWLEDGE_BASES, getArticle, getKB } from '@/data/mock';
import { aiSearch } from '@/services/AIService';
import type { ArticleData } from '@/data/mock';
import type { FeedPost } from '@/types';

interface SearchResult {
  type: 'article' | 'post' | 'ai';
  title: string;
  id: string;
  kbId?: string;
  content?: string;
  kbName?: string;
  confirms?: number;
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  // 直接包含
  if (t.includes(q)) return true;
  // 每个词都出现
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => t.includes(w))) return true;
  return false;
}

function doLocalSearch(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const q = query.trim().toLowerCase();

  // 搜文章：标题 + 正文 + 知识库名
  Object.values(ARTICLES).forEach((a: ArticleData) => {
    const kb = getKB(a.kbId);
    const haystack = [a.title, a.content, kb?.name ?? '', kb?.desc ?? ''].join(' ');
    if (fuzzyMatch(haystack, q)) {
      results.push({
        type: 'article',
        title: a.title,
        id: a.id,
        kbId: a.kbId,
        kbName: kb?.name,
        confirms: a.confirms,
      });
    }
  });

  // 搜帖子：正文 + 标签 + 知识库名
  POSTS.forEach((p: FeedPost) => {
    const kb = p.kbId ? getKB(p.kbId) : undefined;
    const tagText = p.tags.map((t) => t).join(' ');
    const haystack = [p.content, tagText, kb?.name ?? '', kb?.desc ?? ''].join(' ');
    if (fuzzyMatch(haystack, q)) {
      results.push({
        type: 'post',
        title: p.content.slice(0, 80),
        id: p.id,
        kbId: p.kbId,
        kbName: kb?.name,
      });
    }
  });

  // 搜知识库名称和描述
  Object.values(KNOWLEDGE_BASES).forEach((kb) => {
    if (fuzzyMatch(`${kb.name} ${kb.desc}`, q)) {
      // 如果该知识库下的文章还没被搜到，加一条 KB 级别结果
      const alreadyFound = results.some(
        (r) => r.kbId === kb.id
      );
      if (!alreadyFound && kb.articles.length > 0) {
        const firstArticle = getArticle(kb.articles[0]);
        if (firstArticle) {
          results.push({
            type: 'article',
            title: firstArticle.title,
            id: firstArticle.id,
            kbId: kb.id,
            kbName: kb.name,
            confirms: firstArticle.confirms,
          });
        }
      }
    }
  });

  // 去重（同一 id 只出现一次）
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.type}-${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function SearchOverlay() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [showSupplement, setShowSupplement] = useState(false);
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const navigate = useNavigate();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setAiError('');
      setAiAnswer('');
      return;
    }

    setLoading(true);
    setAiError('');
    setAiAnswer('');

    await new Promise((r) => setTimeout(r, 200));

    // 本地搜索
    const localResults = doLocalSearch(q);
    setResults(localResults);
    setLoading(false);

    // 本地无结果 → 尝试 AI
    if (localResults.length === 0) {
      setAiLoading(true);
      try {
        const articleCtx = Object.values(ARTICLES).slice(0, 10).map((a: ArticleData) => ({
          title: a.title,
          summary: a.content.slice(0, 200),
        }));
        const aiRes = await aiSearch(q, articleCtx);
        setAiAnswer(aiRes.answer);
      } catch {
        // AI 不可用时：降级展示最相关内容
        const fallback = doLocalSearch(q.split(/\s+/)[0] || q);
        if (fallback.length > 0) {
          setResults(fallback.slice(0, 3));
          setAiError('AI 暂时无法回答，以下是可能相关的内容');
        } else {
          setAiError('暂时无法找到相关信息。试试换个关键词，或者直接分享你知道的校园信息');
        }
      } finally {
        setAiLoading(false);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setShowSupplement(false);
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
            placeholder="想知道什么？"
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
              输入问题搜索校园信息
            </p>
            <p className="mt-1 text-xs text-ink-faint">
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

        {aiLoading && (
          <div className="flex items-center gap-2 py-6 text-ink-muted">
            <Sparkles size={16} className="animate-pulse text-sage" />
            <span className="text-sm">AI 正在帮你搜索...</span>
          </div>
        )}

        {/* AI 回答 */}
        {aiAnswer && (
          <div className="mb-4 w-full rounded-lg border border-sage-light bg-sage-light/30 p-4 text-left">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-sage">
              <Sparkles size={13} />
              AI 回答 · 仅供参考
            </div>
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
              {aiAnswer}
            </div>
            {!showSupplement && (
              <button
                onClick={() => setShowSupplement(true)}
                className="mt-3 text-sm font-medium text-sage hover:underline"
              >
                我知道准确信息，来补充
              </button>
            )}
          </div>
        )}

        {/* AI 降级提示 */}
        {aiError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <p>{aiError}</p>
          </div>
        )}

        {/* 无结果 */}
        {!loading && !aiLoading && query && results.length === 0 && !aiAnswer && !aiError && (
          <div className="py-16 text-center text-ink-muted">
            <p>未找到相关内容</p>
            <p className="mt-2 text-xs">正在询问 AI...</p>
          </div>
        )}

        {/* 结果列表 */}
        <div className="space-y-2">
          {results.map((r, i) =>
            r.type === 'ai' ? null : (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onClick={() => handleResultClick(r)}
                className="w-full rounded-lg border border-border-light bg-surface p-4 text-left transition-all hover:border-border hover:shadow-md"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
                  {r.type === 'article' ? (
                    <BookOpen size={12} />
                  ) : (
                    <MessageSquare size={12} />
                  )}
                  {r.type === 'article' ? '文章' : '帖子'}
                  {r.kbName && (
                    <>
                      <span>·</span>
                      <span className="text-sage">{r.kbName}</span>
                    </>
                  )}
                  {r.confirms !== undefined && r.confirms > 0 && (
                    <>
                      <span>·</span>
                      <span>{r.confirms} 人确认</span>
                    </>
                  )}
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
