import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Frown, ArrowRight } from 'lucide-react';
import { CAMPUS_CATEGORIES, getCategoryBySlug } from '../constants';
import { useCampusStore } from '../store';
import { CampusAISearch } from '../components/CampusAISearch';

export const CampusHomePage: React.FC = () => {
  const initialize = useCampusStore((s) => s.initialize);
  const searchArticles = useCampusStore((s) => s.searchArticles);
  // 直接订阅数据数组（persist 水合后触发重渲染）
  const articles = useCampusStore((s) => s.articles);
  const topics = useCampusStore((s) => s.topics);

  // 本地搜索状态
  const [localQuery, setLocalQuery] = useState('');
  const searchResults = useMemo(() => {
    const q = localQuery.trim();
    return q ? searchArticles(q) : [];
  }, [localQuery, searchArticles]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setLocalQuery('');
  }, []);

  // 从 articles 派生热门内容
  const featured = useMemo(
    () => articles.filter((a) => a.publishedAt).sort((a, b) => b.views - a.views).slice(0, 6),
    [articles],
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 品牌标题 */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-slate-800">
          校园<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">生活指南</span>
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto">
          亲测推荐 · 真实体验 · 遇到问题，靠 AI 解决
        </p>
      </div>

      {/* AI 搜索框 */}
      <CampusAISearch />

      {/* 本地关键词搜索 */}
      <div className="mb-6 max-w-xl mx-auto">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="输入关键词搜索文章..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setLocalQuery(localQuery); }}
            className="w-full pl-11 pr-14 py-2.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-slate-800 placeholder:text-slate-400"
          />
          {localQuery ? (
            <button
              onClick={clearSearch}
              className="absolute right-12 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          ) : null}
          <button
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
            onClick={() => { if (localQuery.trim()) { /* keep query */ } }}
            aria-label="搜索"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 8 分类入口 或 搜索结果 */}
      {localQuery.trim() ? (
        /* 搜索结果 */
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              搜索"{localQuery}"的结果
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({searchResults.length} 篇)
              </span>
            </h2>
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X size={14} />
              清除搜索
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((article) => {
                const cat = getCategoryBySlug(article.category);
                const CatIcon = cat?.icon;
                return (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="group flex flex-col md:flex-row gap-5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {article.coverImage && (
                    <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {cat && (
                      <div className="flex items-center gap-1 mb-1">
                        {CatIcon && <CatIcon size={12} style={{ color: cat.color }} />}
                        <span className="text-xs font-medium" style={{ color: cat?.color }}>{cat?.name}</span>
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <span>{article.views} 阅读</span>
                      <span>·</span>
                      <span>{article.likes} 喜欢</span>
                    </div>
                  </div>
                </Link>
              );})}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Frown size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">没有找到相关结果</h3>
              <p className="text-sm text-slate-400 mb-4">
                试试其他关键词，或者{" "}
                <button onClick={clearSearch} className="text-blue-600 hover:text-blue-700">
                  清除搜索
                </button>
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 分类入口 */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {CAMPUS_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* 专题推荐 */}
      {topics.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">专题推荐</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={topic.articleIds[0] ? `/article/${topic.articleIds[0]}` : `/category/${topic.category}`}
                className="group block rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* 专题封面 */}
                {topic.coverImage && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={topic.coverImage}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* 渐变遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    {/* 标题和描述叠加在渐变上 */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-base font-semibold line-clamp-1">{topic.title}</h3>
                      <p className="text-xs text-white/80 mt-1 line-clamp-1">{topic.description}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/90 mt-2">
                        {topic.articleIds.length} 篇文章
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 热门内容 */}
      {featured.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">热门内容</h2>
          <div className="space-y-3">
            {featured.map((article) => {
              const cat = getCategoryBySlug(article.category);
              const CatIcon = cat?.icon;
              return (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="group flex flex-col md:flex-row gap-5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {article.coverImage && (
                  <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {cat && (
                    <div className="flex items-center gap-1 mb-1">
                      {CatIcon && <CatIcon size={12} style={{ color: cat.color }} />}
                      <span className="text-xs font-medium" style={{ color: cat?.color }}>{cat?.name}</span>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{article.views} 阅读</span>
                    <span>·</span>
                    <span>{article.likes} 喜欢</span>
                  </div>
                </div>
              </Link>
            );})}
          </div>
        </div>
      )}
    </div>
  );
};
