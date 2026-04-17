import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, List } from 'lucide-react';
import { MOCK_ARTICLES, MOCK_TOPICS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { useContentStore } from '@/store/useContentStore';
import { DocRenderer } from '../components/DocRenderer';
import { extractDocToc } from '@/utils/docMarkdown';

export const ArticleReadPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [searchParams] = useSearchParams();
  const topicIdFromQuery = searchParams.get('topicId');
  const navigate = useNavigate();
  const { themeMode } = useAppStore();

  const [tocOpen, setTocOpen] = useState(false);

  const contentStore = useContentStore();
  const fromStore = contentStore.getArticleById(articleId || '');
  const mapped = fromStore
    ? {
        id: fromStore.id,
        topicId: fromStore.tags.find((t) => t.startsWith('topic:'))?.slice('topic:'.length),
        title: fromStore.title,
        summary: fromStore.summary,
        content: fromStore.markdown,
        domain: fromStore.domain,
        author: '站长',
        authorLevel: 'certified',
        date: new Date(fromStore.publishedAt || fromStore.updatedAt).toLocaleDateString(),
        readTime: '3 min',
        imageUrl: fromStore.coverImageUrl,
        isVideo: false,
        isFeatured: fromStore.tags.includes('featured'),
        stats: { views: fromStore.stats?.views ?? 0, likes: fromStore.stats?.likes ?? 0, comments: 0 },
        visibility: fromStore.visibility,
        schoolId: fromStore.schoolId,
      }
    : null;
  const article = mapped || MOCK_ARTICLES.find((a) => a.id === articleId);
  const articleContent = article?.content || '';
  const toc = extractDocToc(articleContent);
  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-slate-400 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> 返回
        </button>
        <div className="text-center py-20 text-slate-400">未找到文章</div>
      </div>
    );
  }

  // Topic 数据
  const effectiveTopicId = topicIdFromQuery || article.topicId;
  const topic = effectiveTopicId ? MOCK_TOPICS.find((t) => t.id === effectiveTopicId) : null;
  const topicArticles = topic ? MOCK_ARTICLES.filter((a) => a.topicId === topic.id) : [];
  const isEyeCare = themeMode === 'eye-care';

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar (Topic TOC) - Desktop only */}
      {topic && (
        <aside
          className={`hidden lg:block w-72 border-r border-slate-100 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto ${
            isEyeCare ? 'bg-[#F7F6F2]' : 'bg-white'
          }`}
        >
          <button
            onClick={() => navigate('/')}
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
                onClick={() => navigate(`/article/${a.id}?topicId=${topic.id}`)}
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
          <span
            className="cursor-pointer hover:text-slate-600"
            onClick={() => navigate('/')}
          >
            首页
          </span>
          <span>/</span>
          {topic ? (
            <>
              <span className="cursor-pointer hover:text-slate-600 truncate max-w-[150px]">
                {topic.title}
              </span>
              <span>/</span>
            </>
          ) : (
            <span>{article.domain}</span>
          )}
          <span className="text-slate-800 font-medium truncate max-w-[200px]">
            {article.title}
          </span>
        </div>

        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{article.title}</h1>
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              className="xl:hidden shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <List size={16} />
                目录
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"></div>
              <span>{article.author}</span>
            </div>
            <span>{article.date}</span>
            <span>{article.readTime}</span>
          </div>
        </header>

        <article
          className={`prose prose-lg max-w-none ${
            isEyeCare ? 'prose-stone' : 'prose-slate'
          }`}
        >
          <DocRenderer markdown={article.content} />
        </article>

        {/* Comments Section Mock */}
        <div className="mt-16 pt-8 border-t border-slate-100">
          <h3 className="font-bold text-lg mb-6">评论 (2)</h3>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                <div>
                  <div className="font-bold text-sm text-slate-800">用户 {i}</div>
                  <p className="text-sm text-slate-600 mt-1">
                    这篇文章对我很有帮助，特别是关于实操的部分！
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right TOC - Desktop only */}
      <aside className="hidden xl:block w-64 p-6 sticky top-16 h-[calc(100vh-64px)]">
        <h4 className="text-sm font-bold uppercase text-slate-400 mb-4">目录</h4>
        <div className="border-l border-slate-200 pl-4">
          {toc.length ? (
            <div className="space-y-2 text-sm">
              {toc.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToHeading(item.id)}
                  style={{ paddingLeft: Math.max(0, (item.depth - 1) * 10) }}
                  className="block w-full text-left text-slate-500 hover:text-blue-600"
                >
                  {item.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400">暂无目录</div>
          )}
        </div>
      </aside>

      {/* Mobile TOC Drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setTocOpen(false)} />
          <div
            className={`absolute right-0 top-0 h-full w-[min(90vw,360px)] border-l border-slate-200 p-6 overflow-y-auto ${
              isEyeCare ? 'bg-[#F7F6F2]' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-500">目录</div>
              <button
                type="button"
                onClick={() => setTocOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                关闭
              </button>
            </div>
            {toc.length ? (
              <div className="space-y-2 text-sm">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      scrollToHeading(item.id);
                      setTocOpen(false);
                    }}
                    style={{ paddingLeft: Math.max(0, (item.depth - 1) * 12) }}
                    className="block w-full text-left rounded-md px-2 py-2 text-slate-700 hover:bg-slate-100"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">暂无目录</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
