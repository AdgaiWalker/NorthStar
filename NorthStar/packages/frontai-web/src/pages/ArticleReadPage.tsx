import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, List, LoaderCircle } from 'lucide-react';
import type { Article, Topic } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { DocRenderer } from '../components/DocRenderer';
import { extractDocToc } from '@/utils/docMarkdown';
import { compassApi } from '@/services/api';

type ArticleLoadState = {
  key: string;
  article: Article | null;
  topics: Topic[];
  topicArticles: Article[];
  error: string;
};

export const ArticleReadPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [searchParams] = useSearchParams();
  const topicIdFromQuery = searchParams.get('topicId');
  const navigate = useNavigate();
  const { themeMode } = useAppStore();
  const [tocOpen, setTocOpen] = useState(false);
  const [loadState, setLoadState] = useState<ArticleLoadState>({
    key: '',
    article: null,
    topics: [],
    topicArticles: [],
    error: '',
  });

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;
    const requestKey = `${articleId}:${topicIdFromQuery ?? ''}`;

    Promise.all([compassApi.getArticle(articleId), compassApi.listTopics(), compassApi.listArticles()])
      .then(([articleResult, topicResult, articleListResult]) => {
        if (cancelled) return;
        const effectiveTopicId = topicIdFromQuery || articleResult.topicId;
        setLoadState({
          key: requestKey,
          article: articleResult,
          topics: topicResult.items,
          topicArticles: effectiveTopicId ? articleListResult.items.filter((item) => item.topicId === effectiveTopicId) : [],
          error: '',
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadState({
            key: requestKey,
            article: null,
            topics: [],
            topicArticles: [],
            error: err instanceof Error ? err.message : '文章加载失败，请稍后重试。',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [articleId, topicIdFromQuery]);

  const article = loadState.article;
  const topics = loadState.topics;
  const topicArticles = loadState.topicArticles;
  const error = !articleId ? '缺少文章 ID。' : loadState.error;
  const currentKey = articleId ? `${articleId}:${topicIdFromQuery ?? ''}` : '';
  const loading = Boolean(articleId) && loadState.key !== currentKey;
  const articleContent = article?.content || '';
  const toc = extractDocToc(articleContent);
  const effectiveTopicId = topicIdFromQuery || article?.topicId;
  const topic = effectiveTopicId ? topics.find((item) => item.id === effectiveTopicId) : null;
  const isEyeCare = themeMode === 'eye-care';

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          正在加载文章...
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft size={18} className="mr-1" /> 返回
        </button>
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error || '未找到文章。'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {topic && (
        <aside
          className={`hidden h-[calc(100vh-64px)] w-72 overflow-y-auto border-r border-slate-100 p-6 lg:sticky lg:top-16 lg:block ${
            isEyeCare ? 'bg-[#F7F6F2]' : 'bg-white'
          }`}
        >
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={14} /> 返回首页
          </button>
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-bold">{topic.title}</h3>
            <p className="line-clamp-2 text-xs text-slate-500">{topic.description}</p>
          </div>
          <div className="space-y-1">
            {topicArticles.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => navigate(`/article/${item.id}?topicId=${topic.id}`)}
                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  item.id === articleId
                    ? 'bg-blue-50 font-medium text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mt-0.5 text-xs opacity-50">{idx + 1}.</span>
                <span className="line-clamp-2">{item.title}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="mx-auto max-w-4xl flex-1 p-6 md:p-12">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/')}>
            首页
          </span>
          <span>/</span>
          {topic ? (
            <>
              <span className="max-w-[150px] truncate">{topic.title}</span>
              <span>/</span>
            </>
          ) : (
            <span>{article.domain}</span>
          )}
          <span className="max-w-[200px] truncate font-medium text-slate-800">{article.title}</span>
        </div>

        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="mb-4 text-3xl font-extrabold md:text-4xl">{article.title}</h1>
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 xl:hidden"
            >
              <span className="inline-flex items-center gap-2">
                <List size={16} />
                目录
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>{article.author}</span>
            <span>{article.date}</span>
            <span>{article.readTime}</span>
            {isContentStale(article.date) && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle size={12} />
                发布时间较早，信息可能已变化
              </span>
            )}
          </div>
        </header>

        <article className={`prose prose-lg max-w-none ${isEyeCare ? 'prose-stone' : 'prose-slate'}`}>
          <DocRenderer markdown={article.content} />
        </article>
      </div>

      <aside className="hidden h-[calc(100vh-64px)] w-64 p-6 xl:sticky xl:top-16 xl:block">
        <h4 className="mb-4 text-sm font-bold uppercase text-slate-400">目录</h4>
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

      {tocOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setTocOpen(false)} />
          <div
            className={`absolute right-0 top-0 h-full w-[min(90vw,360px)] overflow-y-auto border-l border-slate-200 p-6 ${
              isEyeCare ? 'bg-[#F7F6F2]' : 'bg-white'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
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
                    className="block w-full rounded-md px-2 py-2 text-left text-slate-700 hover:bg-slate-100"
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

function isContentStale(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 180;
}