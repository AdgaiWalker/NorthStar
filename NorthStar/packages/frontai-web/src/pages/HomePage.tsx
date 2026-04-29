import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentType, ExperienceTab, Article, Tool, Topic } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AISearch } from '../components/AISearch';
import { ArticleCard, ToolCard, TopicCard } from '../components/CardComponents';
import { FloatingDock } from '../components/FloatingDock';
import { AlertTriangle, ArrowRight, Book, FileText, Layout, LoaderCircle, Zap } from 'lucide-react';
import { compassApi } from '@/services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    themeMode,
    currentDomain,
    selectedToolIds,
    toggleToolSelection,
    clearSelection,
    isToolFavorited,
    toggleFavoriteTool,
    isArticleFavorited,
    toggleFavoriteArticle,
    setFavoriteToolIds,
    setFavoriteArticleIds,
    isLoggedIn,
  } = useAppStore();

  const [contentType, setContentType] = useState<ContentType>(ContentType.TOOL);
  const [experienceTab, setExperienceTab] = useState<ExperienceTab>('featured');
  const [presetQuery, setPresetQuery] = useState('');
  const presetQuestions = [
    '如何用 AI 生成短视频封面',
    'AI 写代码哪个工具最好',
    '用 AI 自动做 PPT 的方法',
  ];
  const [tools, setTools] = useState<Tool[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  const handleToggleFavorite = async (targetType: 'tool' | 'article' | 'topic', targetId: string, currentlyFavorited: boolean) => {
    try {
      if (currentlyFavorited) {
        await compassApi.removeFavorite({ targetType, targetId });
      } else {
        await compassApi.addFavorite({ targetType, targetId });
      }
      if (targetType === 'tool') toggleFavoriteTool(targetId);
      if (targetType === 'article') toggleFavoriteArticle(targetId);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([compassApi.listTools(), compassApi.listTopics(), compassApi.listArticles()])
      .then(([toolResult, topicResult, articleResult]) => {
        if (cancelled) return;
        setTools(toolResult.items);
        setTopics(topicResult.items);
        setArticles(articleResult.items);
      })
      .catch((error) => {
        if (!cancelled) {
          setContentError(error instanceof Error ? error.message : '全球内容加载失败，请稍后重试。');
        }
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    compassApi.listFavorites()
      .then((result) => {
        const toolIds = result.items.filter((f) => f.targetType === 'tool').map((f) => f.targetId);
        const articleIds = result.items.filter((f) => f.targetType === 'article').map((f) => f.targetId);
        setFavoriteToolIds(toolIds);
        setFavoriteArticleIds(articleIds);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // 数据过滤：工具展示全部，经验和文章按领域过滤
  const filteredTools = tools;
  const filteredTopics = topics.filter((t) => t.domain === currentDomain);
  const domainArticles = articles.filter((article) => article.domain === currentDomain);
  const featuredArticles = domainArticles.filter((a) => a.isFeatured && !a.topicId);
  const plazaArticles = domainArticles.filter((a) => !a.isFeatured);

  const isEyeCare = themeMode === 'eye-care';

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      {/* Hero */}
      <section className="pt-8 pb-8 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            遇到{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              难题
            </span>
            ？
            <br className="md:hidden" />
            用{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              AI
            </span>{' '}
            解决
          </h1>
          <p
            className={`text-sm md:text-xl max-w-2xl mx-auto mb-8 ${
              isEyeCare ? 'text-stone-500' : 'text-slate-500'
            }`}
          >
            你只管提出问题，我们提供视频教程和实战工具，助你快速破局。
          </p>

          <AISearch
            tools={filteredTools}
            articles={domainArticles}
            onToolClick={(id) => navigate(`/tool/${id}`)}
            onArticleClick={(id) => navigate(`/article/${id}`)}
            themeMode={themeMode}
            initialQuery={presetQuery}
          />

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {presetQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPresetQuery(q)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isEyeCare
                    ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Module Switcher */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`p-1 rounded-2xl flex ${
              isEyeCare ? 'bg-[#EBE9E0]' : 'bg-slate-200/50'
            }`}
          >
            <button
              onClick={() => setContentType(ContentType.TOOL)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                contentType === ContentType.TOOL
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap size={16} /> 工具推荐
            </button>
            <button
              onClick={() => setContentType(ContentType.EXPERIENCE)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                contentType === ContentType.EXPERIENCE
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Book size={16} /> 经验心得
            </button>
          </div>
        </div>

        {/* Tools View */}
        {contentLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" />
            正在加载全球内容...
          </div>
        )}

        {!contentLoading && contentError && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            {contentError}
          </div>
        )}

        {contentType === ContentType.TOOL && (
          <div className={contentLoading || contentError ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-4 duration-500'}>
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2">
                <Zap className="text-blue-500" size={24} /> 热门工具
              </h3>
              <button
                onClick={() => navigate('/tools')}
                className={`text-sm font-semibold flex items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isEyeCare
                    ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                查看全部 <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => navigate(`/tool/${tool.id}`)}
                  themeMode={themeMode}
                  isSelected={selectedToolIds.has(tool.id)}
                  isFavorited={isToolFavorited(tool.id)}
                  onToggleSelection={(e) => {
                    e?.stopPropagation();
                    toggleToolSelection(tool.id);
                  }}
                  onToggleFavorite={(e) => {
                    e?.stopPropagation();
                    handleToggleFavorite('tool', tool.id, isToolFavorited(tool.id));
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Experience View */}
        {contentType === ContentType.EXPERIENCE && (
          <div className={contentLoading || contentError ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-4 duration-500'}>
            {/* Sub Tabs */}
            <div className="flex gap-6 mb-8 border-b border-slate-200 pb-1">
              <button
                onClick={() => setExperienceTab('featured')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
                  experienceTab === 'featured'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                精品专区
              </button>
              <button
                onClick={() => setExperienceTab('plaza')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
                  experienceTab === 'plaza'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                大众广场
              </button>
            </div>

            {experienceTab === 'featured' ? (
              <div className="space-y-8">
                {/* Topics Section */}
                {filteredTopics.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Layout size={18} /> 系列主题
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTopics.map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          themeMode={themeMode}
                          onClick={() => {
                            const firstFromStore = domainArticles.find(
                              (a) => a.topicId === topic.id
                            );

                            if (firstFromStore) {
                              navigate(`/article/${firstFromStore.id}?topicId=${topic.id}`);
                              return;
                            }

                            window.alert('该系列暂时没有可阅读的内容');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Independent Featured Articles */}
                {featuredArticles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 mt-8 flex items-center gap-2">
                      <FileText size={18} /> 精选文章
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {featuredArticles.map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          themeMode={themeMode}
                          onClick={() => navigate(`/article/${article.id}`)}
                          isFavorited={isArticleFavorited(article.id)}
                          onToggleFavorite={(e) => {
                            e?.stopPropagation();
                            handleToggleFavorite('article', article.id, isArticleFavorited(article.id));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {plazaArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    themeMode={themeMode}
                    onClick={() => navigate(`/article/${article.id}`)}
                    isFavorited={isArticleFavorited(article.id)}
                    onToggleFavorite={(e) => {
                      e?.stopPropagation();
                      handleToggleFavorite('article', article.id, isArticleFavorited(article.id));
                    }}
                  />
                ))}
                {plazaArticles.length === 0 && (
                  <div className="text-center py-20 text-slate-400">
                    暂无内容，快来投稿吧！
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <FloatingDock
        selectedToolIds={selectedToolIds}
        tools={tools}
        onClearSelection={clearSelection}
        onGenerate={() => navigate('/solution/new')}
      />
    </div>
  );
};
