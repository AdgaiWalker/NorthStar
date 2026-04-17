import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, List, X } from 'lucide-react';
import { useCampusStore } from '../store';
import { getCategoryBySlug } from '../constants';
import { DocRenderer } from '../components/DocRenderer';
import { extractDocToc } from '../utils/docMarkdown';

export const CampusArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // 直接订阅数据（persist 水合后触发重渲染）
  const articles = useCampusStore((s) => s.articles);
  const topics = useCampusStore((s) => s.topics);

  const article = useMemo(
    () => articles.find((a) => a.id === id),
    [articles, id],
  );

  const [tocOpen, setTocOpen] = useState(false);
  const toc = article ? extractDocToc(article.content) : [];

  // 获取专题信息（如果文章属于专题）
  const topic = useMemo(
    () => (article?.topicId ? topics.find((t) => t.id === article.topicId) : undefined),
    [article?.topicId, topics],
  );
  const topicArticles = useMemo(() => {
    if (!topic) return [];
    return topic.articleIds
      .map((aid) => articles.find((a) => a.id === aid))
      .filter((a): a is NonNullable<typeof a> => !!a && !!a.publishedAt);
  }, [topic, articles]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center text-slate-400 hover:text-slate-700 mb-6">
          <ArrowLeft size={16} className="mr-1" />
          返回首页
        </Link>
        <p className="text-slate-500">文章不存在</p>
      </div>
    );
  }

  const category = getCategoryBySlug(article.category);

  // 根据是否有专题决定布局方式
  const isTopicArticle = !!topic;
  const containerClass = isTopicArticle
    ? 'grid lg:grid-cols-[288px_1fr_256px] gap-6'
    : 'flex gap-6';
  const maxWidthClass = isTopicArticle ? 'max-w-7xl' : 'max-w-6xl';

  return (
    <div className={`${maxWidthClass} mx-auto px-4 py-4`}>
      {/* 显式返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>返回</span>
      </button>

      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link to="/" className="hover:text-slate-600">首页</Link>
        <span>/</span>
        {category && (
          <>
            <Link to={`/category/${category.slug}`} className="hover:text-slate-600">
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-600 truncate max-w-xs">{article.title}</span>
      </nav>

      <div className={containerClass}>
        {/* 左栏：系列目录（仅专题文章显示） */}
        {isTopicArticle && topic && (
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-xl border-r border-slate-100 p-4">
              {/* 专题标题 */}
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {topic.title}
              </h3>
              {/* 专题描述 */}
              {topic.description && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {topic.description}
                </p>
              )}

              {/* 文章列表 */}
              <nav className="space-y-1">
                {topicArticles.map((topicArticle) => {
                  const isCurrent = topicArticle.id === article.id;
                  return (
                    <Link
                      key={topicArticle.id}
                      to={`/article/${topicArticle.id}`}
                      className={`block text-sm py-2 px-3 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-500'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {topicArticle.title}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}

        {/* 中栏：文章正文 */}
        <article className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 p-6 md:p-8">
          {/* 移动端 TOC 切换按钮 */}
          {toc.length > 0 && (
            <button
              onClick={() => setTocOpen(true)}
              className="md:hidden flex items-center gap-1.5 mb-4 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
            >
              <List size={14} />
              目录
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-6">
            <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</span>
            <span>·</span>
            <span>{article.views} 阅读</span>
            <span>·</span>
            <span>{article.likes} 喜欢</span>
          </div>
          <DocRenderer markdown={article.content} />
        </article>

        {/* 右栏：TOC 目录 */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                目录
              </h4>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-xs text-slate-400 hover:text-slate-700 truncate"
                    style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {/* 移动端 TOC 抽屉 */}
      {tocOpen && toc.length > 0 && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setTocOpen(false)}
          />
          {/* 抽屉 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-5 md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-800">文章目录</h4>
              <button
                onClick={() => setTocOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1 max-h-64 overflow-y-auto">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setTocOpen(false)}
                  className="block text-sm text-slate-600 hover:text-blue-600 py-1.5 truncate"
                  style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
};
