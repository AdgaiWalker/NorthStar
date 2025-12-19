import React, { useState, useEffect } from 'react';
import { Domain, ContentType, ExperienceTab, ViewState, ThemeMode, Language, UserSolution } from './types';
import { MOCK_TOOLS, MOCK_ARTICLES, MOCK_TOPICS } from './constants';
import { Header, Footer } from './components/Layout';
import { ToolCard, ArticleCard, TopicCard } from './components/CardComponents';
import { AISearch } from './components/AISearch';
import { ArrowLeft, ArrowRight, ExternalLink, Heart, Share2, PlayCircle, Book, BookOpen, Zap, Layout, FileText, User, ShoppingBag, Settings, LogOut, ChevronLeft, ChevronRight, Menu, Plus, Folder, Search, Filter, ChevronDown, CheckSquare, Sparkles, X, Trash2, Download, Table, Calendar, Clock, Eye, Loader2, MoreHorizontal, AlertTriangle, Shield, Copy, Check, MessageCircle, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { STORAGE_KEYS, storageGet, storageSet } from './utils/storage';
import { isStringArray, isUserSolutionArray, isThemeMode, isLanguage } from './utils/guards';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const themeModeResult = storageGet(STORAGE_KEYS.themeMode, 'light' as ThemeMode, isThemeMode);
  const languageResult = storageGet(STORAGE_KEYS.language, 'zh' as Language, isLanguage);
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(themeModeResult.value);
  const [language, setLanguage] = useState<Language>(languageResult.value);
  const [currentDomain, setCurrentDomain] = useState<Domain>('creative');
  const [contentType, setContentType] = useState<ContentType>(ContentType.TOOL);
  const [experienceTab, setExperienceTab] = useState<ExperienceTab>('featured');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- Solution Studio State ---
  // isSelectionMode removed - adopting implicit shopping-cart style selection
  const selectedToolIdsResult = storageGet(STORAGE_KEYS.selectedToolIds, [] as string[], isStringArray);
  const userSolutionsResult = storageGet(STORAGE_KEYS.userSolutions, [] as UserSolution[], isUserSolutionArray);
  
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set(selectedToolIdsResult.value));
  const [userSolutions, setUserSolutions] = useState<UserSolution[]>(userSolutionsResult.value); // Mock storage

  const [showStorageResetNotice, setShowStorageResetNotice] = useState<boolean>(
    themeModeResult.resetDetected || 
    languageResult.resetDetected || 
    selectedToolIdsResult.resetDetected || 
    userSolutionsResult.resetDetected
  );
  
  // --- Floating Dock State ---
  const [dockCopied, setDockCopied] = useState(false);
  const [showDockShareMenu, setShowDockShareMenu] = useState(false);

  // --- Helpers ---
  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'eye-care' : 'light');
  const bgClass = themeMode === 'eye-care' ? 'bg-[#F7F6F2] min-h-screen text-stone-800' : 'bg-slate-50 min-h-screen text-slate-900';

  useEffect(() => {
    storageSet(STORAGE_KEYS.themeMode, themeMode);
  }, [themeMode]);

  useEffect(() => {
    storageSet(STORAGE_KEYS.language, language);
  }, [language]);

  useEffect(() => {
    storageSet(STORAGE_KEYS.selectedToolIds, Array.from(selectedToolIds));
  }, [selectedToolIds]);

  useEffect(() => {
    storageSet(STORAGE_KEYS.userSolutions, userSolutions);
  }, [userSolutions]);

  useEffect(() => {
    if (!showStorageResetNotice) return;
    const t = window.setTimeout(() => setShowStorageResetNotice(false), 4000);
    return () => window.clearTimeout(t);
  }, [showStorageResetNotice]);

  const toggleToolSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSet = new Set(selectedToolIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedToolIds(newSet);
  };

  const clearSelection = () => {
    setSelectedToolIds(new Set());
  };

  const saveMockSolution = (solution: UserSolution) => {
    setUserSolutions(prev => [solution, ...prev]);
    setView({ type: 'user-center', tab: 'solutions' });
  };

  const deleteSolution = (id: string) => {
    setUserSolutions(prev => prev.filter(s => s.id !== id));
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportSolution = (sol: UserSolution, format: 'md' | 'txt' | 'csv') => {
      const toolNames = sol.toolIds.map(tid => MOCK_TOOLS.find(t => t.id === tid)?.name || tid).join(', ');
      let content = '';
      let filename = `${sol.title.replace(/\s+/g, '_')}.${format}`;
      let mimeType = 'text/plain';

      switch (format) {
        case 'md':
          content = `# ${sol.title}\n\n**目标**: ${sol.targetGoal}\n**创建时间**: ${sol.createdAt}\n**工具组合**: ${toolNames}\n\n---\n\n${sol.aiAdvice}`;
          mimeType = 'text/markdown';
          break;
        case 'txt':
          content = `标题: ${sol.title}\n目标: ${sol.targetGoal}\n创建时间: ${sol.createdAt}\n工具组合: ${toolNames}\n\n----------------\n\n${sol.aiAdvice.replace(/[#*`]/g, '')}`;
          break;
        case 'csv':
          content = `ID,Title,Target Goal,Created At,Tools,AI Advice\n"${sol.id}","${sol.title.replace(/"/g, '""')}","${sol.targetGoal.replace(/"/g, '""')}","${sol.createdAt}","${toolNames}","${sol.aiAdvice.replace(/"/g, '""')}"`;
          mimeType = 'text/csv';
          break;
      }
      downloadFile(content, filename, mimeType);
  };
  
  const handleDockShare = () => {
      const selectedTools = MOCK_TOOLS.filter(t => selectedToolIds.has(t.id));
      const text = `我在盘根 AI 指南针发现了这些好用的工具：\n${selectedTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}\n快来看看：https://pangen-ai.com`;
      navigator.clipboard.writeText(text).then(() => {
          setDockCopied(true);
          setTimeout(() => setDockCopied(false), 2000);
      });
  };

  // --- Filtering ---
  const filteredTools = MOCK_TOOLS.filter(t => t.domain === currentDomain);
  const filteredTopics = MOCK_TOPICS.filter(t => t.domain === currentDomain);
  const featuredArticles = MOCK_ARTICLES.filter(a => a.domain === currentDomain && a.isFeatured && !a.topicId);
  const plazaArticles = MOCK_ARTICLES.filter(a => a.domain === currentDomain && !a.isFeatured);
  const domainArticles = MOCK_ARTICLES.filter(a => a.domain === currentDomain);

  // --- Views ---

  // M1: Home & Navigation
  const HomeView = () => (
    <div className="animate-in fade-in duration-500 pb-32">
      {/* Hero */}
      <section className="pt-8 pb-8 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              遇到 <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">难题</span>？
              <br className="md:hidden"/>
              用 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span> 解决
            </h1>
            <p className={`text-sm md:text-xl max-w-2xl mx-auto mb-8 ${themeMode === 'eye-care' ? 'text-stone-500' : 'text-slate-500'}`}>
              你只管提出问题，我们提供视频教程和实战工具，助你快速破局。
            </p>
            
            <AISearch 
              tools={filteredTools}
              articles={domainArticles}
              onToolClick={(id) => setView({ type: 'tool-detail', toolId: id })}
              onArticleClick={(id) => setView({ type: 'article-read', articleId: id })}
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
                 <Zap className="text-blue-500" size={24} /> 
                 热门工具
               </h3>
               {/* Note: The 'Create Solution' button has been removed to simplify the UI */}
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredTools.map(tool => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  onClick={() => setView({ type: 'tool-detail', toolId: tool.id })}
                  themeMode={themeMode}
                  isSelected={selectedToolIds.has(tool.id)}
                  onToggleSelection={(e) => toggleToolSelection(tool.id, e)}
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
                  className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${experienceTab === 'featured' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                 精品专区
               </button>
               <button 
                  onClick={() => setExperienceTab('plaza')}
                  className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${experienceTab === 'plaza' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                 大众广场
               </button>
             </div>

             {experienceTab === 'featured' ? (
                <div className="space-y-8">
                  {/* Topics Section */}
                  {filteredTopics.length > 0 && (
                     <div>
                       <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Layout size={18}/> 系列主题</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredTopics.map(topic => (
                             <TopicCard 
                               key={topic.id} 
                               topic={topic}
                               themeMode={themeMode}
                               onClick={() => {
                                  // Navigate to first article of topic
                                  const firstArticle = MOCK_ARTICLES.find(a => a.topicId === topic.id);
                                  if(firstArticle) setView({ type: 'article-read', articleId: firstArticle.id, topicId: topic.id });
                               }}
                             />
                          ))}
                       </div>
                     </div>
                  )}
                  
                  {/* Independent Featured Articles */}
                  {featuredArticles.length > 0 && (
                     <div>
                       <h3 className="text-lg font-bold mb-4 mt-8 flex items-center gap-2"><FileText size={18}/> 精选文章</h3>
                       <div className="grid grid-cols-1 gap-4">
                          {featuredArticles.map(article => (
                             <ArticleCard 
                               key={article.id} 
                               article={article} 
                               themeMode={themeMode}
                               onClick={() => setView({ type: 'article-read', articleId: article.id })} 
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
                      onClick={() => setView({ type: 'article-read', articleId: article.id })} 
                    />
                  ))}
                  {plazaArticles.length === 0 && (
                    <div className="text-center py-20 text-slate-400">暂无内容，快来投稿吧！</div>
                  )}
                </div>
             )}
          </div>
        )}
      </section>

      {/* Floating Dock (Redesigned) */}
      {selectedToolIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 w-auto max-w-[95vw]">
           <div className="flex items-center p-2 rounded-full bg-[#1A1A1A]/95 backdrop-blur-2xl text-white shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/10 ring-1 ring-white/5 gap-4">
              
              {/* Left: Tools Preview & Count */}
              <div className="flex items-center pl-2 gap-3">
                 <div className="flex -space-x-3">
                    {Array.from(selectedToolIds).slice(0, 4).map(id => {
                      const tool = MOCK_TOOLS.find(t => t.id === id);
                      if(!tool) return null;
                      return (
                        <img key={id} src={tool.imageUrl} className="w-9 h-9 rounded-full border-2 border-[#1A1A1A] object-cover ring-1 ring-white/10" alt={tool.name} />
                      );
                    })}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] text-white/50 font-medium leading-none mb-0.5 tracking-wide">已选</span>
                    <span className="text-sm text-white font-bold leading-none whitespace-nowrap">{selectedToolIds.size} <span className="text-xs font-normal text-white/50">个工具</span></span>
                 </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px h-8 bg-white/10"></div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 pr-1">
                 
                 {/* Clear Button */}
                  <button 
                    onClick={clearSelection}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                    title="清空选择"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Share Button */}
                  <div className="relative">
                      <button
                        onClick={() => setShowDockShareMenu(!showDockShareMenu)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${showDockShareMenu ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
                        title="分享"
                      >
                        {dockCopied ? <Check size={16} className="text-green-400"/> : <Share2 size={18} />}
                      </button>
                      
                      {showDockShareMenu && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[60] animate-in slide-in-from-bottom-2 fade-in">
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-200"></div>
                                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-50 mb-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">分享清单</span>
                                    <button onClick={() => setShowDockShareMenu(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                                </div>
                                <button onClick={() => { handleDockShare(); setShowDockShareMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                    <Copy size={16} className="text-slate-400"/> 复制文本
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(`盘根AI工具分享：https://pangen-ai.com/share/${Date.now()}`).then(() => alert("链接已复制，请打开微信粘贴")); setShowDockShareMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                    <MessageCircle size={16} className="text-green-500"/> 分享到微信
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(`盘根AI工具分享：https://pangen-ai.com/share/${Date.now()}`).then(() => alert("链接已复制，请打开QQ粘贴")); setShowDockShareMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                    <MessageSquare size={16} className="text-blue-500"/> 分享到 QQ
                                </button>
                          </div>
                      )}
                  </div>

                  {/* Generate Button (Primary) */}
                  <button 
                    onClick={() => setView({ type: 'solution-generate', toolIds: Array.from(selectedToolIds) })}
                    className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Sparkles size={16} fill="currentColor" className="text-blue-200" />
                    生成方案
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  // M2: Tool Detail View
  const ToolDetailView = ({ toolId }: { toolId: string }) => {
    // ... same content as before ...
    const tool = MOCK_TOOLS.find(t => t.id === toolId);
    if (!tool) return <div>未找到该工具</div>;
    const relatedArticles = MOCK_ARTICLES.filter(a => a.relatedToolId === tool.id);

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setView({ type: 'home' })}
          className="flex items-center text-slate-400 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> 返回
        </button>

        <div className={`rounded-3xl overflow-hidden mb-8 ${themeMode === 'eye-care' ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-xl'}`}>
          <div className="h-64 md:h-80 w-full bg-slate-100 relative">
             <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
               <div className="p-8 text-white">
                 <h1 className="text-4xl font-bold mb-2">{tool.name}</h1>
                 <div className="flex items-center gap-4 text-sm font-medium">
                   <div className="flex bg-white/20 backdrop-blur-md px-2 py-1 rounded">
                     <span className="text-amber-400 mr-1">★</span> {tool.rating}
                   </div>
                   <span className="bg-white/20 px-2 py-1 rounded">{tool.usageCount} 人使用</span>
                   <span className="bg-blue-600 px-2 py-1 rounded">{tool.domain}</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="p-8">
             <p className="text-lg leading-relaxed mb-8">{tool.fullDescription}</p>
             <div className="flex gap-4 mb-8">
               <a href={tool.url} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2">
                 访问官网 <ExternalLink size={18} />
               </a>
               <button className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2">
                 <Heart size={18} /> 收藏
               </button>
             </div>

             {relatedArticles.length > 0 && (
               <div className="border-t border-slate-100 pt-8">
                 <h3 className="text-xl font-bold mb-6">相关教程与实战</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {relatedArticles.map(a => (
                     <ArticleCard key={a.id} article={a} onClick={() => setView({ type: 'article-read', articleId: a.id })} themeMode={themeMode} />
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  // M3: Reading Page View
  const ArticleReadView = ({ articleId, topicId }: { articleId: string; topicId?: string }) => {
     // ... same content as before ...
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
          <aside className={`hidden lg:block w-72 border-r border-slate-100 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto ${themeMode === 'eye-care' ? 'bg-[#F7F6F2]' : 'bg-white'}`}>
             <button onClick={() => setView({ type: 'home' })} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm"><ArrowLeft size={14}/> 返回首页</button>
             <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">{topic.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{topic.description}</p>
             </div>
             <div className="space-y-1">
               {topicArticles.map((a, idx) => (
                 <button
                   key={a.id}
                   onClick={() => setView({ type: 'article-read', articleId: a.id, topicId: topic.id })}
                   className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2 ${a.id === articleId ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
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
              <span className="cursor-pointer hover:text-slate-600" onClick={() => setView({ type: 'home' })}>首页</span>
              <span>/</span>
              {topic ? (
                 <>
                   <span className="cursor-pointer hover:text-slate-600 truncate max-w-[150px]">{topic.title}</span>
                   <span>/</span>
                 </>
              ) : <span>{article.domain}</span>}
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
                <img src={article.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <PlayCircle size={64} className="text-white opacity-80 group-hover:scale-110 transition-transform" fill="currentColor"/>
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

  // ... (Keep existing SolutionGenerateView, LoginView, UserCenterView, AdminView) ...
  // New View: Solution Generator (Compact)
  const SolutionGenerateView = ({ toolIds }: { toolIds: string[] }) => {
    const selectedTools = MOCK_TOOLS.filter(t => toolIds.includes(t.id));
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
      setIsGenerating(true);
      // Mock generation delay
      setTimeout(() => {
        setIsGenerating(false);
        const effectiveGoal = goal.trim() || "探索这些工具的通用组合潜力";
        const newSolution: UserSolution = {
          id: Date.now().toString(),
          title: `方案: ${selectedTools.map(t => t.name).join(' + ')}`,
          targetGoal: effectiveGoal,
          toolIds: toolIds,
          aiAdvice: `### AI 智能分析\n\n针对您的目标 **"${effectiveGoal}"**，我们分析了 **${selectedTools.map(t => t.name).join(', ')}** 的组合潜力。\n\n#### 1. 工作流整合\n这些工具可以形成互补的工作流...\n\n#### 2. 关键优势\n- 效率提升\n- 创意扩展\n\n#### 3. 实施建议\n建议先从...`,
          createdAt: new Date().toLocaleDateString()
        };
        saveMockSolution(newSolution);
      }, 1500);
    };

    const handleShare = () => {
        const textToShare = `【盘根 AI 方案生成】\n已选工具：${selectedTools.map(t => t.name).join(' + ')}\n目标：${goal || '探索工具组合潜力'}\n\n快来体验：https://pangen-ai.com`;
        navigator.clipboard.writeText(textToShare).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-in slide-in-from-bottom-4 fade-in">
        <button onClick={() => setView({ type: 'home' })} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1"><ArrowLeft size={16}/> 返回首页</button>
        <div className={`p-8 rounded-3xl ${themeMode === 'eye-care' ? 'bg-[#FDFCF8] shadow-sm ring-1 ring-stone-200' : 'bg-white shadow-xl'}`}>
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Sparkles size={24}/></div>
                <h2 className="text-2xl font-bold">生成 AI 解决方案</h2>
             </div>
             
             {/* Share Button for Non-Logged In Users */}
             <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                title="复制内容分享"
             >
                {copied ? <span className="text-green-600 flex items-center gap-1"><CheckSquare size={16}/> 已复制</span> : <>
                    <Share2 size={18} />
                    <span className="hidden sm:inline">分享</span>
                </>}
             </button>
          </div>
          
          <div className="mb-6">
             <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">已选工具</label>
             <div className="flex flex-wrap gap-2">
               {selectedTools.map(t => (
                 <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700">
                    <img src={t.imageUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                    {t.name}
                 </div>
               ))}
             </div>
          </div>

          <div className="mb-8">
             <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">您的目标</label>
             <textarea 
               value={goal}
               onChange={(e) => setGoal(e.target.value)}
               placeholder="例如：我想结合这两个工具制作一个自动化营销视频..."
               className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
             />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? <><Loader2 className="animate-spin"/> 正在思考...</> : <><Sparkles /> 生成方案</>}
          </button>
        </div>
      </div>
    );
  };

  const LoginView = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in">
      <div className={`p-8 rounded-3xl w-full max-w-md text-center ${themeMode === 'eye-care' ? 'bg-white shadow-sm border border-stone-200' : 'bg-white shadow-xl'}`}>
         <h2 className="text-2xl font-bold mb-2">欢迎回来</h2>
         <p className="text-slate-500 mb-8">登录以保存您的 AI 方案和收藏。</p>
         <button 
           onClick={() => { setIsLoggedIn(true); setView({ type: 'home' }); }}
           className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
         >
           模拟一键登录
         </button>
      </div>
    </div>
  );

  const UserCenterView = ({ tab = 'profile' }: { tab?: 'profile' | 'history' | 'favorites' | 'creator' | 'solutions' }) => {
    // Local state for UserCenter
    const [viewSolution, setViewSolution] = useState<UserSolution | null>(null);
    const [solutionToDelete, setSolutionToDelete] = useState<string | null>(null);

    // Share state
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Export state
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        // Reset state when viewSolution changes or closes
        setShowShareMenu(false);
        setLinkCopied(false);
        setShowExportMenu(false);
    }, [viewSolution]);

    const handleDeleteConfirm = () => {
      if (solutionToDelete) {
        deleteSolution(solutionToDelete);
        // If we are currently viewing the deleted solution, close the drawer
        if (viewSolution?.id === solutionToDelete) {
          setViewSolution(null);
        }
        setSolutionToDelete(null);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in">
         <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Nav */}
            <div className="w-full md:w-64 flex-shrink-0">
               <div className={`p-4 rounded-2xl ${themeMode === 'eye-care' ? 'bg-[#FDFCF8] border border-stone-100' : 'bg-white shadow-sm border border-slate-100'}`}>
                  <div className="flex items-center gap-3 px-2 mb-6">
                     <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                        <img src="https://picsum.photos/100/100?random=user" alt="User" />
                     </div>
                     <div>
                        <div className="font-bold text-sm">My User</div>
                        <div className="text-xs text-slate-400">Pro Member</div>
                     </div>
                  </div>
                  
                  <nav className="space-y-1">
                     <button onClick={() => setView({type: 'user-center', tab: 'profile'})} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${tab === 'profile' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>个人资料</button>
                     <button onClick={() => setView({type: 'user-center', tab: 'solutions'})} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${tab === 'solutions' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>我的方案</button>
                     <button onClick={() => setView({type: 'user-center', tab: 'favorites'})} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${tab === 'favorites' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>收藏夹</button>
                  </nav>
               </div>
            </div>

            {/* Content */}
            <div className="flex-1">
               {tab === 'solutions' && (
                 <div>
                    <h2 className="text-2xl font-bold mb-6">我的 AI 方案</h2>
                    {userSolutions.length === 0 ? (
                       <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                          <Sparkles className="mx-auto mb-2 opacity-50" size={32}/>
                          <p>还没有生成过方案</p>
                          <button onClick={() => { setView({type: 'home'}); setContentType(ContentType.TOOL); }} className="mt-4 text-blue-600 font-bold text-sm hover:underline">去创建</button>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          {userSolutions.map(sol => (
                             <div 
                                key={sol.id} 
                                onClick={() => setViewSolution(sol)}
                                className={`p-6 rounded-2xl cursor-pointer hover:border-blue-400 transition-all ${themeMode === 'eye-care' ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100 shadow-sm'}`}
                             >
                                <div className="flex justify-between items-start mb-2">
                                   <h3 className="font-bold text-lg">{sol.title}</h3>
                                   <div className="flex gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); exportSolution(sol, 'md'); }} 
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Download size={16}/>
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setSolutionToDelete(sol.id); }} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16}/>
                                      </button>
                                   </div>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{sol.targetGoal}</p>
                                <div className="flex items-center gap-2">
                                   {sol.toolIds.map(tid => {
                                      const t = MOCK_TOOLS.find(mt => mt.id === tid);
                                      if(!t) return null;
                                      return (
                                         <img key={tid} src={t.imageUrl} className="w-6 h-6 rounded-full border border-white shadow-sm" title={t.name} />
                                      )
                                   })}
                                   <span className="text-xs text-slate-400 ml-2">{sol.createdAt}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
               )}
               
               {tab === 'profile' && (
                  <div className={`p-8 rounded-2xl ${themeMode === 'eye-care' ? 'bg-white' : 'bg-white shadow-sm'}`}>
                     <h2 className="text-xl font-bold mb-4">个人资料</h2>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden"><img src="https://picsum.photos/100/100?random=user" className="w-full h-full object-cover"/></div>
                        <div>
                           <div className="font-bold text-lg">My User</div>
                           <div className="text-slate-500">user@pangen.ai</div>
                        </div>
                     </div>
                     <div className="space-y-4 max-w-md">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">昵称</label>
                           <input type="text" defaultValue="My User" className="w-full p-2 bg-slate-50 rounded-lg border-none" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">邮箱</label>
                           <input type="text" defaultValue="user@pangen.ai" disabled className="w-full p-2 bg-slate-50 rounded-lg border-none opacity-50 cursor-not-allowed" />
                        </div>
                     </div>
                  </div>
               )}

               {/* Placeholders for other tabs */}
               {(tab === 'favorites' || tab === 'history' || tab === 'creator') && (
                 <div className="text-center py-12 text-slate-400">功能开发中...</div>
               )}
            </div>
         </div>

         {/* Side Drawer for Solution Details */}
         {viewSolution && (
            <div className="fixed inset-0 z-[60] flex justify-end">
               <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setViewSolution(null)}></div>
               <div className={`relative w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col ${themeMode === 'eye-care' ? 'bg-[#FDFCF8]' : 'bg-white'}`}>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start z-10">
                     <div>
                        <h2 className="text-2xl font-bold mb-1">{viewSolution.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                           <span className="flex items-center gap-1"><Calendar size={14}/> {viewSolution.createdAt}</span>
                           <span className="flex items-center gap-1"><Sparkles size={14} className="text-blue-500"/> AI 生成方案</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {/* Share Button with Menu */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className={`p-2 rounded-full transition-colors ${showShareMenu ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                title="分享方案"
                            >
                                <Share2 size={24} />
                            </button>
                            {showShareMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                    <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">分享方案</div>
                                    <button 
                                        onClick={() => {
                                            // Mock copy link
                                            navigator.clipboard.writeText(`https://pangen-ai.com/s/${viewSolution.id}`);
                                            setLinkCopied(true);
                                            setTimeout(() => {
                                                setLinkCopied(false);
                                                setShowShareMenu(false);
                                            }, 1000);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 transform origin-left ${linkCopied ? 'bg-green-50 text-green-700 font-bold scale-[1.02]' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        {linkCopied ? <CheckSquare size={16} className="text-green-500 animate-in zoom-in spin-in-90"/> : <Copy size={16}/>}
                                        {linkCopied ? '已复制链接' : '复制链接'}
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(`https://pangen-ai.com/s/${viewSolution.id} (Share to WeChat)`).then(() => alert("已复制链接，请打开微信粘贴分享"))}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <div className="w-5 h-5 bg-green-500 text-white rounded-md flex items-center justify-center"><MessageCircle size={12} fill="currentColor"/></div>
                                        分享到微信
                                    </button>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(`https://pangen-ai.com/s/${viewSolution.id} (Share to QQ)`).then(() => alert("已复制链接，请打开QQ粘贴分享"))}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <div className="w-5 h-5 bg-blue-500 text-white rounded-md flex items-center justify-center"><MessageSquare size={12} fill="currentColor"/></div>
                                        分享到 QQ
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button 
                                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this AI solution: ${viewSolution.title}`)}&url=${encodeURIComponent(`https://pangen-ai.com/s/${viewSolution.id}`)}`, '_blank')}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <div className="w-5 h-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">X</div>
                                        分享到 X (Twitter)
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(`https://pangen-ai.com/s/${viewSolution.id}`)}&title=${encodeURIComponent(`【盘根AI】${viewSolution.title}`)}`, '_blank')}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <div className="w-5 h-5 bg-red-500 text-white rounded-md flex items-center justify-center text-[10px] font-bold">wb</div>
                                        分享到微博
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setViewSolution(null)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                     </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8">
                     <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1"><Layout size={12}/> 核心目标</h3>
                        <p className="text-slate-700 font-medium">{viewSolution.targetGoal}</p>
                     </div>

                     <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Zap size={16}/> 涉及工具</h3>
                        <div className="flex flex-wrap gap-3">
                           {viewSolution.toolIds.map(tid => {
                              const tool = MOCK_TOOLS.find(t => t.id === tid);
                              return tool ? (
                                 <div key={tid} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all bg-white cursor-pointer" onClick={() => setView({ type: 'tool-detail', toolId: tid })}>
                                    <img src={tool.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                    <div>
                                       <div className="font-bold text-sm">{tool.name}</div>
                                       <div className="text-xs text-slate-500">{tool.domain}</div>
                                    </div>
                                 </div>
                              ) : null;
                           })}
                        </div>
                     </div>

                     <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><BookOpen size={16}/> 方案建议</h3>
                        <div className={`prose max-w-none ${themeMode === 'eye-care' ? 'prose-stone' : 'prose-slate'}`}>
                           <ReactMarkdown>{viewSolution.aiAdvice}</ReactMarkdown>
                        </div>
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center relative">
                     <div className="flex items-center gap-2 relative">
                        <button 
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-all shadow-sm flex items-center gap-2"
                        >
                          <Download size={16}/> 导出方案
                        </button>
                        {showExportMenu && (
                             <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 origin-bottom-left z-50">
                                <button onClick={() => { exportSolution(viewSolution, 'md'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">Markdown</button>
                                <button onClick={() => { exportSolution(viewSolution, 'txt'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">TXT 文本</button>
                                <button onClick={() => { exportSolution(viewSolution, 'csv'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">CSV 表格</button>
                             </div>
                        )}
                     </div>
                     <button 
                       onClick={() => setSolutionToDelete(viewSolution.id)}
                       className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                     >
                        <Trash2 size={16} /> 删除
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Delete Confirmation Modal */}
         {solutionToDelete && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
                onClick={() => setSolutionToDelete(null)}
              ></div>
              <div className={`relative w-full max-w-sm p-6 rounded-2xl shadow-2xl scale-100 transition-all ${themeMode === 'eye-care' ? 'bg-[#FDFCF8]' : 'bg-white'}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">确认删除方案？</h3>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    此操作无法撤销。该方案及其所有 AI 分析建议将被永久移除。
                  </p>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setSolutionToDelete(null)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleDeleteConfirm}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
         )}
      </div>
    );
  };

  const AdminView = () => (
    <div className="p-8 text-center animate-in fade-in">
       <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4 text-slate-400"><Shield size={32}/></div>
       <h2 className="text-2xl font-bold mb-2">管理后台</h2>
       <p className="text-slate-500">仅供演示。此处将显示内容管理系统。</p>
       <button onClick={() => setView({type: 'home'})} className="mt-6 text-blue-600 font-medium hover:underline">返回前台</button>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${bgClass}`}>
      {showStorageResetNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] px-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg">
            <AlertTriangle size={16} className="text-amber-300" />
            <span className="text-sm font-medium">本地数据异常，系统已重置到默认状态。</span>
            <button
              type="button"
              onClick={() => setShowStorageResetNotice(false)}
              className="ml-1 p-1 rounded-full hover:bg-white/10"
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <Header 
        themeMode={themeMode} 
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        navigate={setView}
        currentView={view}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        currentDomain={currentDomain}
        setDomain={setCurrentDomain}
      />
      
      <main className="flex-grow pt-6">
        {view.type === 'home' && <HomeView />}
        {view.type === 'tool-detail' && <ToolDetailView toolId={view.toolId} />}
        {view.type === 'article-read' && <ArticleReadView articleId={view.articleId} topicId={view.topicId} />}
        {view.type === 'login' && <LoginView />}
        {view.type === 'solution-generate' && <SolutionGenerateView toolIds={view.toolIds} />}
        {view.type === 'user-center' && <UserCenterView tab={view.tab} />}
        {view.type === 'admin' && <AdminView />}
      </main>

      <Footer />
    </div>
  );
};

export default App;