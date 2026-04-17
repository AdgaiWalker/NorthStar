import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentType, ExperienceTab, Article, ContentItem } from '@/types';
import { MOCK_ARTICLES, MOCK_TOOLS, MOCK_TOPICS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { useContentStore } from '@/store/useContentStore';
import { AISearch } from '../components/AISearch';
import { ArticleCard, ToolCard, TopicCard } from '../components/CardComponents';
import { FloatingDock } from '../components/FloatingDock';
import { Book, FileText, Layout, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    themeMode,
    currentDomain,
    selectedToolIds,
    toggleToolSelection,
    clearSelection,
  } = useAppStore();

  const [contentType, setContentType] = useState<ContentType>(ContentType.TOOL);
  const [experienceTab, setExperienceTab] = useState<ExperienceTab>('featured');

  // 数据过滤
  const filteredTools = MOCK_TOOLS.filter(
    (t) => t.domain === currentDomain
  );
  const filteredTopics = MOCK_TOPICS.filter((t) => t.domain === currentDomain);
  // 改为使用内容存储（已发布）作为文章源
  const contentStore = useContentStore();
  const published = contentStore.getPublishedArticlesByDomain(currentDomain);
  const mapToArticle = (it: ContentItem): Article => {
    const topicTag = it.tags.find((t) => t.startsWith('topic:'));
    const topicId = topicTag ? topicTag.slice('topic:'.length) : undefined;
    const isFeatured = it.tags.includes('featured');

    return {
      id: it.id,
      topicId,
      title: it.title,
      summary: it.summary,
      content: it.markdown,
      domain: it.domain,
      author: '站长',
      authorLevel: 'certified',
      date: new Date(it.publishedAt || it.updatedAt).toLocaleDateString(),
      readTime: '3 min',
      relatedToolId: it.relatedToolIds?.[0],
      imageUrl: it.coverImageUrl,
      isVideo: false,
      isFeatured,
      stats: { views: it.stats?.views ?? 0, likes: it.stats?.likes ?? 0, comments: 0 },
    };
  };
  const mappedArticles = published.map(mapToArticle);

  const featuredArticles = mappedArticles.filter((a) => a.isFeatured && !a.topicId);
  const plazaArticles = mappedArticles.filter((a) => !a.isFeatured);
  const domainArticles = mappedArticles;

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
          />
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
        {contentType === ContentType.TOOL && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2">
                <Zap className="text-blue-500" size={24} /> 热门工具
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => navigate(`/tool/${tool.id}`)}
                  themeMode={themeMode}
                  isSelected={selectedToolIds.has(tool.id)}
                  onToggleSelection={(e) => {
                    e?.stopPropagation();
                    toggleToolSelection(tool.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Experience View */}
        {contentType === ContentType.EXPERIENCE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                            const firstFromMock = MOCK_ARTICLES.find(
                              (a) => a.topicId === topic.id && a.domain === currentDomain
                            );

                            const firstArticle = firstFromStore || firstFromMock;

                            if (firstArticle) {
                              navigate(`/article/${firstArticle.id}?topicId=${topic.id}`);
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
        onClearSelection={clearSelection}
        onGenerate={() => navigate('/solution/new')}
      />
    </div>
  );
};
