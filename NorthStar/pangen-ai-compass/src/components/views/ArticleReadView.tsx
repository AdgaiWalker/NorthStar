import React from 'react';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ThemeMode, ViewState } from '../../types';
import { MOCK_ARTICLES, MOCK_TOPICS } from '../../constants';

interface ArticleReadViewProps {
  articleId: string;
  topicId?: string;
  themeMode: ThemeMode;
  navigate: (view: ViewState) => void;
}

export const ArticleReadView: React.FC<ArticleReadViewProps> = ({ articleId, topicId, themeMode, navigate }) => {
  const article = MOCK_ARTICLES.find(a => a.id === articleId);
  if (!article) return <div>未找到文章</div>;

  // Topic Data
  const effectiveTopicId = topicId || article.topicId;
  const topic = effectiveTopicId ? MOCK_TOPICS.find(t => t.id === effectiveTopicId) : null;
  const topicArticles = topic ? MOCK_ARTICLES.filter(a => a.topicId === topic.id) : [];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar (Topic TOC) - Desktop only */}
      {topic && (
        <aside
          className={`hidden lg:block w-72 border-r border-slate-100 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto ${
            themeMode === 'eye-care' ? 'bg-[#F7F6F2]' : 'bg-white'
          }`}
        >
          <button
            onClick={() => navigate({ type: 'home' })}
            className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} /> 返回首页
          </button>
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">{topic.title}</h3>
            <p className="text-xs text-slate-500 line-clamp-2">{topic.description}</p>
          </div>
          <div className="space-y-1">
            {topicArticles.map((a, idx) => (
              <button
                key={a.id}
                onClick={() => navigate({ type: 'article-read', articleId: a.id, topicId: topic.id })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2 ${
                  a.id === articleId
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs opacity-50 mt-0.5">{idx + 1}.</span>
                <span className="line-clamp-2">{a.title}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto p-6 md:p-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate({ type: 'home' })}>
            首页
          </span>
          <span>/</span>
          {topic ? (
            <>
              <span className="cursor-pointer hover:text-slate-600 truncate max-w-[150px]">{topic.title}</span>
              <span>/</span>
            </>
          ) : (
            <span>{article.domain}</span>
          )}
          <span className="text-slate-800 font-medium truncate max-w-[200px]">{article.title}</span>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"></div>
              <span>{article.author}</span>
            </div>
            <span>{article.date}</span>
            <span>{article.readTime}</span>
          </div>
        </header>

        {article.isVideo && (
          <div className="aspect-video bg-black rounded-xl mb-8 relative group cursor-pointer shadow-lg">
            <img src={article.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle
                size={64}
                className="text-white opacity-80 group-hover:scale-110 transition-transform"
                fill="currentColor"
              />
            </div>
            <div className="absolute bottom-4 left-4 text-white text-xs bg-black/50 px-2 py-1 rounded">模拟视频播放器</div>
          </div>
        )}

        <article className={`prose prose-lg max-w-none ${themeMode === 'eye-care' ? 'prose-stone' : 'prose-slate'}`}>
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>

        {/* Comments Section Mock */}
        <div className="mt-16 pt-8 border-t border-slate-100">
          <h3 className="font-bold text-lg mb-6">评论 (2)</h3>
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                <div>
                  <div className="font-bold text-sm text-slate-800">用户 {i}</div>
                  <p className="text-sm text-slate-600 mt-1">这篇文章对我很有帮助，特别是关于实操的部分！</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right TOC - Desktop only */}
      <aside className="hidden xl:block w-64 p-6 sticky top-16 h-[calc(100vh-64px)]">
        <h4 className="text-sm font-bold uppercase text-slate-400 mb-4">目录</h4>
        <div className="space-y-2 text-sm text-slate-500 border-l border-slate-200 pl-4">
          <div className="hover:text-blue-600 cursor-pointer">视频重点摘要</div>
          <div className="hover:text-blue-600 cursor-pointer">详细步骤</div>
          <div className="hover:text-blue-600 cursor-pointer">总结</div>
        </div>
      </aside>
    </div>
  );
};
