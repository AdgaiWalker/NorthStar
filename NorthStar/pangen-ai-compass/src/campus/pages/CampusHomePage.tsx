import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CAMPUS_CATEGORIES } from '../constants';
import { useCampusStore } from '../store';
import { CampusAISearch } from '../components/CampusAISearch';

export const CampusHomePage: React.FC = () => {
  const initialize = useCampusStore((s) => s.initialize);
  // 直接订阅数据数组（persist 水合后触发重渲染）
  const articles = useCampusStore((s) => s.articles);
  const topics = useCampusStore((s) => s.topics);

  useEffect(() => {
    initialize();
  }, [initialize]);

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

      {/* 8 分类入口 */}
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

      {/* 专题推荐 */}
      {topics.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">专题推荐</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/article/${topic.articleIds[0]}`}
                className="group block rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* 专题封面 */}
                {topic.coverImage && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={topic.coverImage}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* 渐变遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* 标题和描述在遮罩上方 */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-base font-semibold line-clamp-1">{topic.title}</h3>
                      <p className="text-xs text-white/80 mt-1 line-clamp-1">{topic.description}</p>
                    </div>
                  </div>
                )}
                {/* 文章数量 badge */}
                <div className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {topic.articleIds.length} 篇文章
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 热门内容 */}
      {featured.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">热门内容</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featured.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="group block rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{article.views} 阅读</span>
                    <span>·</span>
                    <span>{article.likes} 喜欢</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
