import React from 'react';
import { Book, FileText, Layout, Zap } from 'lucide-react';
import { Article, ContentType, ExperienceTab, ThemeMode, Tool, Topic, ViewState } from '../../types';
import { AISearch } from '../AISearch';
import { ArticleCard, ToolCard, TopicCard } from '../CardComponents';
import { FloatingDock } from '../FloatingDock';

interface HomeViewProps {
  themeMode: ThemeMode;
  contentType: ContentType;
  setContentType: (t: ContentType) => void;
  experienceTab: ExperienceTab;
  setExperienceTab: (t: ExperienceTab) => void;
  tools: Tool[];
  topics: Topic[];
  featuredArticles: Article[];
  plazaArticles: Article[];
  domainArticles: Article[];
  selectedToolIds: Set<string>;
  toggleToolSelection: (id: string, e?: React.MouseEvent) => void;
  clearSelection: () => void;
  navigate: (view: ViewState) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  themeMode,
  contentType,
  setContentType,
  experienceTab,
  setExperienceTab,
  tools,
  topics,
  featuredArticles,
  plazaArticles,
  domainArticles,
  selectedToolIds,
  toggleToolSelection,
  clearSelection,
  navigate,
}) => (
  <div className="animate-in fade-in duration-500 pb-32">
    {/* Hero */}
    <section className="pt-8 pb-8 px-4 text-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
          遇到问题</span>？
          <br className="md:hidden" />
          靠 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI 解决
        </h1>
        <p
          className={`text-sm md:text-xl max-w-2xl mx-auto mb-8 ${
            themeMode === 'eye-care' ? 'text-stone-500' : 'text-slate-500'
          }`}
        >
          说出你的问题，AI 帮你找工具、搭路径、出方案。不是为了学 AI，是为了解决问题。
        </p>

        <AISearch
          tools={tools}
          articles={domainArticles}
          onToolClick={id => navigate({ type: 'tool-detail', toolId: id })}
          onArticleClick={id => navigate({ type: 'article-read', articleId: id })}
          themeMode={themeMode}
        />
      </div>
    </section>

    {/* Main Content */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Module Switcher */}
      <div className="flex flex-col items-center mb-6">
        <div className={`p-1 rounded-2xl flex ${themeMode === 'eye-care' ? 'bg-[#EBE9E0]' : 'bg-slate-200/50'}`}>
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
          {/* Header */}
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="font-bold text-xl md:text-2xl flex items-center gap-2">
              <Zap className="text-blue-500" size={24} /> 热门工具
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {tools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => navigate({ type: 'tool-detail', toolId: tool.id })}
                themeMode={themeMode}
                isSelected={selectedToolIds.has(tool.id)}
                onToggleSelection={e => toggleToolSelection(tool.id, e)}
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
              {topics.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Layout size={18} /> 系列主题
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map(topic => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        themeMode={themeMode}
                        onClick={() => {
                          const firstArticle = domainArticles.find(a => a.topicId === topic.id);
                          if (firstArticle)
                            navigate({ type: 'article-read', articleId: firstArticle.id, topicId: topic.id });
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
                    {featuredArticles.map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        themeMode={themeMode}
                        onClick={() => navigate({ type: 'article-read', articleId: article.id })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {plazaArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  themeMode={themeMode}
                  onClick={() => navigate({ type: 'article-read', articleId: article.id })}
                />
              ))}
              {plazaArticles.length === 0 && <div className="text-center py-20 text-slate-400">暂无内容，快来投稿吧！</div>}
            </div>
          )}
        </div>
      )}
    </section>

    <FloatingDock
      selectedToolIds={selectedToolIds}
      onClearSelection={clearSelection}
      onGenerate={() => navigate({ type: 'solution-generate', toolIds: Array.from(selectedToolIds) })}
    />
  </div>
);
