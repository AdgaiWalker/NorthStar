import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCampusStore } from '../store';
import { getCategoryBySlug } from '../constants';
import { DocRenderer } from '../../components/DocRenderer';
import { extractDocToc } from '../../utils/docMarkdown';

export const CampusArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
      .filter((a) => !!a && !!a.publishedAt);
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
    ? 'grid lg:grid-cols-[220px_1fr_220px] gap-6'
    : 'flex gap-6';
  const maxWidthClass = isTopicArticle ? 'max-w-7xl' : 'max-w-6xl';

  return (
    <div className={`${maxWidthClass} mx-auto px-4 py-4`}>
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
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-xl border border-slate-200 p-4">
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-6">
            <span>{new Date(article.publishedAt).toLocaleDateString('zh-CN')}</span>
            <span>·</span>
            <span>{article.views} 阅读</span>
            <span>·</span>
            <span>{article.likes} 喜欢</span>
          </div>
          <DocRenderer markdown={article.content} />
        </article>

        {/* 右栏：TOC 目录 */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-56 flex-shrink-0">
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
    </div>
  );
};
