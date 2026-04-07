import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCategoryBySlug } from '../constants';
import { useCampusStore } from '../store';

// 排序类型
type SortType = 'hot' | 'new';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = getCategoryBySlug(slug || '');
  // 直接订阅数据（persist 水合后触发重渲染）
  const allArticles = useCampusStore((s) => s.articles);
  const allTopics = useCampusStore((s) => s.topics);

  // 按分类过滤
  const articles = useMemo(
    () => (slug ? allArticles.filter((a) => a.category === slug && a.publishedAt) : []),
    [allArticles, slug],
  );
  const topics = useMemo(
    () => allTopics.filter((t) => t.category === slug),
    [allTopics, slug],
  );

  // 排序状态
  const [sortType, setSortType] = useState<SortType>('hot');

  // 根据排序类型对文章进行排序
  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    if (sortType === 'hot') {
      sorted.sort((a, b) => b.views - a.views);
    } else {
      sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return sorted;
  }, [articles, sortType]);

  if (!category) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">分类不存在</p>
        <Link to="/" className="text-blue-500 hover:underline text-sm">返回首页</Link>
      </div>
    );
  }

  const Icon = category.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
          首页
        </Link>
        <span className="text-sm text-slate-300">/</span>
        <div className="flex items-center gap-2">
          <Icon size={18} style={{ color: category.color }} />
          <h1 className="text-lg font-semibold text-slate-800">{category.name}</h1>
        </div>
      </div>

      {/* 分类描述 */}
      <p className="text-sm text-slate-500 mb-6">{category.description}</p>

      {/* 专题卡片区域 - 仅在有专题时显示 */}
      {topics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-700 mb-4">专题</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={topic.articleIds[0] ? `/article/${topic.articleIds[0]}` : '#'}
                className="group flex gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* 专题封面图 */}
                {topic.coverImage && (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={topic.coverImage}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                {/* 专题信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-1 mb-1">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {topic.description}
                  </p>
                  {/* 文章数 badge */}
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                    {topic.articleIds.length} 篇文章
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 排序切换器 */}
      {sortedArticles.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSortType('hot')}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              sortType === 'hot'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            热门
          </button>
          <button
            onClick={() => setSortType('new')}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              sortType === 'new'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            最新
          </button>
        </div>
      )}

      {/* 文章列表 */}
      {sortedArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">这个分类还在建设中</p>
          <p className="text-xs text-slate-300 mt-1">内容即将上线，敬请期待</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedArticles.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="group block p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* 封面图 */}
              {article.coverImage && (
                <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-slate-100">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              {/* 标题 */}
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-2">
                {article.title}
              </h3>
              {/* 摘要 */}
              <p className="text-xs text-slate-400 line-clamp-2">{article.summary}</p>
              {/* 统计信息 */}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span>{article.views} 阅读</span>
                <span>·</span>
                <span>{article.likes} 喜欢</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
