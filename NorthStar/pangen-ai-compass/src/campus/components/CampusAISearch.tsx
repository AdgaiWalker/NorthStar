import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Loader2, AlertTriangle, X, Lightbulb } from 'lucide-react';
import { useCampusStore } from '../store';
import { searchCampusWithAI, CampusAISearchResult } from '../services/campusAIService';
import { UI_DELAY } from '@/constants/ui';

export const CampusAISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<CampusAISearchResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const articles = useCampusStore((s) => s.articles);
  const getArticleById = useCampusStore((s) => s.getArticleById);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setIsExpanded(true);

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, UI_DELAY.AI_SEARCH_SIMULATE));

    try {
      const result = await searchCampusWithAI(q, articles);
      setSearchResult(result);
    } catch {
      setError('搜索失败，请稍后重试');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery('');
    setSearchResult(null);
    setError(null);
  };

  const recommendedArticles =
    searchResult?.recommendedArticleIds
      .map((id) => getArticleById(id))
      .filter((a): a is NonNullable<typeof a> => !!a) || [];

  const isFallback = searchResult?.mode === 'fallback';

  return (
    <div className="mb-8">
      <div className="relative max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative flex items-center">
            {/* AI 图标 */}
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 ring-1 ring-blue-100 shadow-sm"
              title="校园 AI 搜索"
            >
              {loading ? (
                <Loader2 size={16} className="text-blue-600 animate-spin" />
              ) : (
                <Sparkles size={16} className="text-blue-600" />
              )}
            </button>

            <input
              type="text"
              placeholder="问校园问题，AI 帮你找答案..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-14 pr-12 py-3 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </button>
          </div>
        </form>

        {/* 搜索提示 */}
        {!isExpanded && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lightbulb size={12} />
            <span>试试"附近有什么好吃的"或"新生报到要带什么"</span>
          </div>
        )}
      </div>

      {/* 搜索结果区域 */}
      {isExpanded && !loading && (
        <div className="mt-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 border border-red-100">
              <AlertTriangle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* AI 结果 */}
          {searchResult && !error && (
            <>
              {/* 降级提示 */}
              {isFallback && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 text-amber-700 px-4 py-3 border border-amber-100">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span className="text-sm">
                    AI 暂时不可用，已为你智能筛选相关内容
                  </span>
                </div>
              )}

              {/* AI 摘要 */}
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">校园生活顾问</span>
                </div>
                <p className="text-sm text-slate-700">{searchResult.summary}</p>
              </div>

              {/* 推荐文章 */}
              {recommendedArticles.length > 0 ? (
                <div className="space-y-3">
                  {recommendedArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/article/${article.id}`}
                      className="group block rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {article.coverImage && (
                        <div className="aspect-video overflow-hidden bg-slate-100">
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <span>{article.views} 阅读</span>
                          <span>·</span>
                          <span>{article.likes} 喜欢</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                  <p className="text-slate-500">没有找到相关内容，试试其他关键词？</p>
                </div>
              )}
            </>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="mt-4 w-full py-2 text-sm text-slate-400 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <X size={14} />
            关闭搜索结果
          </button>
        </div>
      )}
    </div>
  );
};
