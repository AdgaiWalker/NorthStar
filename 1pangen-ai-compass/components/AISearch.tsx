import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import { searchToolsWithAI } from '../services/geminiService';
import { AISearchResultV2 } from '../services/aiContract';
import { Tool, Article } from '../types';
import { ToolCard, ArticleCard } from './CardComponents';

interface AISearchProps {
  tools: Tool[];
  articles: Article[];
  onToolClick: (id: string) => void;
  onArticleClick: (id: string) => void;
  themeMode: 'light' | 'eye-care';
}

export const AISearch: React.FC<AISearchProps> = ({ tools, articles, onToolClick, onArticleClick, themeMode }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISearchResultV2 | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setIsExpanded(true);
    
    // Simulate slight network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const aiResponse = await searchToolsWithAI(query, tools, articles);
    setResult(aiResponse);
    setLoading(false);
  };

  const recommendedTools = result?.suggestedTools
    .map(name => tools.find(t => t.name.includes(name) || name.includes(t.name)))
    .filter((t): t is Tool => !!t) || [];

  const recommendedArticles = result?.suggestedArticles
    .map(title => articles.find(a => a.title.includes(title) || title.includes(a.title)))
    .filter((a): a is Article => !!a) || [];

  const isEyeCare = themeMode === 'eye-care';
  const isDemoMode = result?.mode === 'demo';

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
            <div className="pl-4 text-blue-600">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="我想学剪辑短视频..."
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
        {isExpanded && !loading && result && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {isDemoMode && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 text-amber-800 px-4 py-3 border border-amber-100">
                <AlertTriangle size={18} className="shrink-0" />
                <div className="text-sm font-medium">演示模式：AI 服务不可用，以下为基于评分与关键词的推荐结果。</div>
              </div>
            )}
            <div className="mb-8">
              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-2">AI 推荐方案</h4>
              <p className={`text-lg leading-relaxed font-medium mb-4 ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}>
                {result.summary}
              </p>
              <div className={`p-4 rounded-xl text-sm leading-relaxed ${isEyeCare ? 'bg-amber-50 text-stone-700' : 'bg-slate-50 text-slate-600'}`}>
                <span className="font-bold block mb-1">建议路径:</span>
                {result.recommendation}
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
            
            <button 
              onClick={() => { setIsExpanded(false); setQuery(''); setResult(null); }}
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
