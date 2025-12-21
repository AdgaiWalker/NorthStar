import React from 'react';
import { ArrowLeft, ExternalLink, Heart } from 'lucide-react';
import { ThemeMode, ViewState } from '../../types';
import { MOCK_ARTICLES, MOCK_TOOLS } from '../../constants';
import { ArticleCard } from '../CardComponents';

interface ToolDetailViewProps {
  toolId: string;
  themeMode: ThemeMode;
  navigate: (view: ViewState) => void;
}

export const ToolDetailView: React.FC<ToolDetailViewProps> = ({ toolId, themeMode, navigate }) => {
  const tool = MOCK_TOOLS.find(t => t.id === toolId);
  if (!tool) return <div>未找到该工具</div>;

  const relatedArticles = MOCK_ARTICLES.filter(a => a.relatedToolId === tool.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => navigate({ type: 'home' })}
        className="flex items-center text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-1" /> 返回
      </button>

      <div
        className={`rounded-3xl overflow-hidden mb-8 ${
          themeMode === 'eye-care' ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-xl'
        }`}
      >
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
            <a
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
            >
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
                  <ArticleCard
                    key={a.id}
                    article={a}
                    onClick={() => navigate({ type: 'article-read', articleId: a.id })}
                    themeMode={themeMode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
