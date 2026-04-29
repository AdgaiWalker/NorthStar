import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, ArrowRight, AlertTriangle, Search, Library, Layers, BookOpen } from 'lucide-react';
import { searchToolsWithAI } from '@/services/AIService';
import { buildFallbackResult } from '@/services/aiFallback';
import { AISearchResultV2, checkSensitiveWords } from '@ns/shared';
import { Tool, Article, LibraryMode } from '@/types';
import { ToolCard, ArticleCard } from './CardComponents';
import { UI_DELAY } from '@/constants/ui';

interface AISearchProps {
  tools: Tool[];
  articles: Article[];
  onToolClick: (id: string) => void;
  onArticleClick: (id: string) => void;
  themeMode: 'light' | 'eye-care';
  initialQuery?: string;
}

export const AISearch: React.FC<AISearchProps> = ({ tools, articles, onToolClick, onArticleClick, themeMode, initialQuery }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchMode, setSearchMode] = useState<'ai' | 'normal'>('ai');
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('professional');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  // AI Search Result
  const [aiResult, setAiResult] = useState<AISearchResultV2 | null>(null);

  // Normal Search Result
  const [normalResult, setNormalResult] = useState<{ tools: Tool[]; articles: Article[] } | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const [isExpanded, setIsExpanded] = useState(false);

  // 根据库模式过滤数据
  const getFilteredData = (libMode: LibraryMode) => {
    if (libMode === 'professional') {
      // 专业库：仅精选内容
      return {
        filteredTools: tools, // 工具暂无 isFeatured 字段，全部使用
        filteredArticles: articles.filter(a => a.isFeatured),
      };
    }
    // 综合库：全量内容
    return { filteredTools: tools, filteredArticles: articles };
  };

  const performSearch = async (mode: 'ai' | 'normal', q: string, libMode: LibraryMode = libraryMode) => {
    if (!q.trim()) return;

    // 敏感词输入拦截
    const sensitive = checkSensitiveWords(q);
    if (sensitive.hit) {
      setIsExpanded(true);
      const { filteredTools, filteredArticles } = getFilteredData(libMode);
      setAiResult(buildFallbackResult('sensitive_blocked', q, filteredTools, filteredArticles));
      setNormalResult(null);
      return;
    }

    setLoading(true);
    setIsExpanded(true);

    await new Promise(resolve => setTimeout(resolve, UI_DELAY.AI_SEARCH_SIMULATE));

    const { filteredTools, filteredArticles } = getFilteredData(libMode);

    if (mode === 'ai') {
      const aiResponse = await searchToolsWithAI(q, filteredTools, filteredArticles);
      setAiResult(aiResponse);
      setNormalResult(null);
    } else {
      const needle = q.toLowerCase();
      const matchedTools = filteredTools.filter(t =>
        `${t.name} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase().includes(needle)
      );
      const matchedArticles = filteredArticles.filter(a =>
        `${a.title} ${a.summary}`.toLowerCase().includes(needle)
      );
      setNormalResult({ tools: matchedTools, articles: matchedArticles });
      setAiResult(null);
    }

    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLastSearchedQuery(q);
    await performSearch(searchMode, q);
  };

  const handleModeChange = async (newMode: 'ai' | 'normal') => {
    setSearchMode(newMode);
    
    // 切换模式后重新搜索
    const q = query.trim();
    if (!q || !lastSearchedQuery || q !== lastSearchedQuery) return;

    await performSearch(newMode, q);
  };

  const handleLibraryModeChange = async (newLibMode: LibraryMode) => {
    setLibraryMode(newLibMode);
    
    // 切换库模式后重新搜索
    const q = query.trim();
    if (!q || !lastSearchedQuery || q !== lastSearchedQuery || searchMode !== 'ai') return;

    await performSearch('ai', q, newLibMode);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery('');
    setAiResult(null);
    setNormalResult(null);
  };

  const recommendedTools = aiResult?.suggestedTools
    .map(name => tools.find(t => t.name.includes(name) || name.includes(t.name)))
    .filter((t): t is Tool => !!t) || [];

  const recommendedArticles = aiResult?.suggestedArticles
    .map(title => articles.find(a => a.title.includes(title) || title.includes(a.title)))
    .filter((a): a is Article => !!a) || [];

  const isEyeCare = themeMode === 'eye-care';
  const isDemoMode = aiResult?.mode === 'demo';

  const summaryText = aiResult?.summary || '';
  const displaySummary = isDemoMode
    ? summaryText.replace(/^演示模式[:：]\s*/, '')
    : summaryText;

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className={`relative z-10 rounded-2xl transition-all duration-500 overflow-hidden
        ${isExpanded 
          ? (isEyeCare ? 'bg-[#FDFCF8] shadow-lg ring-1 ring-stone-200' : 'bg-white shadow-xl ring-1 ring-slate-200')
          : 'bg-transparent'
        }`}
      >
        {/* Search Input Area */}
        <form onSubmit={handleSearch} className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 transition-opacity duration-500 ${isExpanded ? 'opacity-0' : 'group-hover:opacity-30'}`}></div>
          <div className={`relative flex items-center p-2 rounded-2xl transition-all duration-300
             ${!isExpanded ? (isEyeCare ? 'bg-[#FDFCF8] shadow-md border border-stone-200' : 'bg-white shadow-lg border border-slate-100') : ''}
          `}>
            {/* 搜索模式切换按钮 */}
            <div className="relative flex items-center pl-2 pr-1">
              <button
                type="button"
                onClick={() => handleModeChange(searchMode === 'ai' ? 'normal' : 'ai')}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  searchMode === 'ai' 
                    ? 'bg-blue-50 ring-1 ring-blue-100 shadow-sm hover:bg-blue-100' 
                    : 'bg-slate-100 ring-1 ring-slate-200 hover:bg-slate-200'
                }`}
                title={searchMode === 'ai' ? '当前: AI 搜索，点击切换为普通搜索' : '当前: 普通搜索，点击切换为 AI 搜索'}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  searchMode === 'ai' 
                    ? <Sparkles size={16} className="text-blue-600" />
                    : <Search size={16} className="text-slate-500" />
                )}
              </button>

              {/* AI 模式下显示库模式切换 */}
              {searchMode === 'ai' && (
                <button
                  type="button"
                  onClick={() => handleLibraryModeChange(libraryMode === 'professional' ? 'comprehensive' : 'professional')}
                  className={`ml-1 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                    libraryMode === 'professional'
                      ? 'bg-indigo-50 ring-1 ring-indigo-100 hover:bg-indigo-100'
                      : 'bg-emerald-50 ring-1 ring-emerald-100 hover:bg-emerald-100'
                  }`}
                  title={libraryMode === 'professional' ? '当前: 专业库（精选内容），点击切换为综合库' : '当前: 综合库（全量内容），点击切换为专业库'}
                >
                  {libraryMode === 'professional' 
                    ? <Library size={16} className="text-indigo-600" />
                    : <Layers size={16} className="text-emerald-600" />
                  }
                </button>
              )}
              
              {/* 分隔线 */}
              <div className="w-px h-6 bg-slate-100 mx-2"></div>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === 'ai' ? "我想学剪辑短视频..." : "输入关键词搜索工具或文章..."}
              className={`w-full p-4 bg-transparent border-none outline-none text-lg placeholder:text-slate-400 ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}
            />
            <button 
              type="submit"
              disabled={loading}
              className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </form>

        {/* Results Area */}
        {isExpanded && !loading && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* AI Search Results */}
            {searchMode === 'ai' && aiResult && (
              <>
                {isDemoMode && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 text-amber-800 px-4 py-3 border border-amber-100">
                    <AlertTriangle size={18} className="shrink-0" />
                    <div className="text-sm font-medium">{aiResult.summary}</div>
                  </div>
                )}

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">AI 推荐方案</h4>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Sparkles size={10} />
                      由 AI 生成，仅供参考
                    </span>
                  </div>
                  <p className={`text-lg leading-relaxed font-medium mb-4 ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}>
                    {displaySummary}
                  </p>
                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${isEyeCare ? 'bg-amber-50 text-stone-700' : 'bg-slate-50 text-slate-600'}`}>
                    <span className="font-bold block mb-1">建议路径:</span>
                    {aiResult.recommendation}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recommendedTools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">推荐工具</h4>
                      <div className="space-y-4">
                        {recommendedTools.map(tool => (
                          <ToolCard
                            key={tool.id}
                            tool={tool}
                            themeMode={themeMode}
                            onClick={() => onToolClick(tool.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendedArticles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">相关文章</h4>
                      <div className="space-y-4">
                        {recommendedArticles.map(article => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            themeMode={themeMode}
                            onClick={() => onArticleClick(article.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Normal Search Results */}
            {searchMode === 'normal' && normalResult && (
              <div className="space-y-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg w-fit">
                  <span>找到 {normalResult.tools.length} 个工具</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{normalResult.articles.length} 篇内容</span>
                </div>

                {normalResult.tools.length === 0 && normalResult.articles.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p>未找到相关结果，换个关键词试试？</p>
                  </div>
                )}

                {normalResult.tools.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Sparkles size={16} /> 工具结果
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {normalResult.tools.map(tool => (
                        <ToolCard
                          key={tool.id}
                          tool={tool}
                          themeMode={themeMode}
                          onClick={() => onToolClick(tool.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {normalResult.articles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <BookOpen size={16} /> 内容结果
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {normalResult.articles.map(article => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          themeMode={themeMode}
                          onClick={() => onArticleClick(article.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleClose}
              className="mt-8 w-full py-3 text-sm text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
            >
              关闭搜索结果
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
