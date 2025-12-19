import React from 'react';
import { Star, Bookmark, PlayCircle, Video, FileText, ArrowRight, Layers, Users, CheckCircle, Circle, CheckCircle2 } from 'lucide-react';
import { Tool, Article, ThemeMode, Topic } from '../types';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
  themeMode: ThemeMode;
  isSelected?: boolean;
  onToggleSelection?: (e: React.MouseEvent) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ 
  tool, onClick, themeMode, isSelected = false, onToggleSelection 
}) => {
  const isEyeCare = themeMode === 'eye-care';

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 relative
        ${isSelected ? 'ring-2 ring-blue-500 transform scale-[0.99]' : 'hover:-translate-y-1'}
        ${isEyeCare 
          ? 'bg-[#FDFCF8] border border-stone-100 shadow-sm' 
          : 'bg-white border border-slate-100 shadow-sm'
        }`}
    >
      {/* Selection Toggle Button - Always visible but subtle when unselected */}
      {onToggleSelection && (
        <div 
          onClick={onToggleSelection}
          className={`absolute top-2 right-2 z-20 p-1.5 rounded-full cursor-pointer transition-all duration-300 transform
             ${isSelected 
               ? 'scale-100 opacity-100' 
               : 'scale-95 opacity-60 hover:opacity-100 hover:scale-110 lg:opacity-0 lg:group-hover:opacity-100' // Hidden on desktop until hover, visible on mobile but dim
             }
          `}
          title={isSelected ? "取消选择" : "加入方案"}
        >
          {isSelected ? (
            <CheckCircle2 className="text-blue-600 bg-white rounded-full fill-white shadow-md" size={26} />
          ) : (
            <Circle className="text-white fill-black/20 hover:fill-black/40 drop-shadow-md backdrop-blur-sm" size={26} strokeWidth={2} />
          )}
        </div>
      )}

      <div className="aspect-[16/10] md:aspect-[16/9] relative overflow-hidden bg-slate-100">
        <img 
          src={tool.imageUrl} 
          alt={tool.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Rating Badge */}
        <div className={`absolute top-1.5 right-auto left-1.5 bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all`}>
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-white">{tool.rating}</span>
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-1 gap-1">
        <h3 className={`font-bold text-sm md:text-base line-clamp-1 leading-tight ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}>{tool.name}</h3>
        
        <p className={`text-xs line-clamp-2 ${isEyeCare ? 'text-stone-500' : 'text-slate-500'}`}>
          {tool.description}
        </p>

         <div className="flex flex-wrap gap-1 mt-1">
            {tool.tags.slice(0, 2).map(tag => (
              <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded ${isEyeCare ? 'bg-stone-100 text-stone-500' : 'bg-slate-50 text-slate-500'}`}>
                #{tag}
              </span>
            ))}
          </div>

        <div className="mt-auto pt-2 flex items-center justify-between text-slate-400">
           <div className="flex items-center gap-1">
             <Users size={12} />
             <span className="text-[10px]">{tool.usageCount}</span>
           </div>
           {/* Removed Bookmark icon to avoid clutter with selection logic */}
        </div>
      </div>
    </div>
  );
};

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  themeMode: ThemeMode;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, themeMode }) => {
  const isEyeCare = themeMode === 'eye-care';

  return (
    <div 
      onClick={onClick}
      className={`flex flex-col md:flex-row gap-5 p-4 rounded-2xl transition-all duration-300 cursor-pointer group
        ${isEyeCare 
          ? 'bg-[#FDFCF8] hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md border border-stone-100' 
          : 'bg-white hover:bg-slate-50/50 border border-slate-100 hover:border-slate-200'
        }`}
    >
      <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden flex-shrink-0 relative">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {article.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
              <PlayCircle size={16} className="text-blue-600 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
           <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${isEyeCare ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
             {article.isVideo ? <Video size={10}/> : <FileText size={10}/>}
             {article.isVideo ? '视频' : '文章'}
           </span>
           {article.isFeatured && (
             <span className="text-amber-500 font-medium">精选</span>
           )}
           <span>•</span>
           <span>{article.readTime}</span>
        </div>
        <h3 className={`text-lg font-bold mb-2 truncate group-hover:text-blue-600 transition-colors ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}>
          {article.title}
        </h3>
        <p className={`text-sm line-clamp-2 mb-2 ${isEyeCare ? 'text-stone-600' : 'text-slate-500'}`}>
          {article.summary}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
             <span>{article.author}</span>
             {article.authorLevel === 'certified' && (
               <span className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center" title="认证作者">
                 <svg viewBox="0 0 24 24" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
               </span>
             )}
          </div>
          <div className="flex items-center gap-3">
             <span>{article.stats.views} 浏览</span>
             <span>{article.stats.likes} 赞</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TopicCardProps {
  topic: Topic;
  onClick: () => void;
  themeMode: ThemeMode;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick, themeMode }) => {
  const isEyeCare = themeMode === 'eye-care';

  return (
    <div 
      onClick={onClick}
      className={`group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      <img src={topic.coverUrl} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
         <div className="flex items-center gap-2 mb-2 text-xs font-medium text-white/80">
            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
              <Layers size={12} /> {topic.articleCount} 篇文章
            </span>
            <span className="flex items-center gap-1 text-amber-400">
               <Star size={12} fill="currentColor"/> {topic.rating}
            </span>
         </div>
         <h3 className="text-xl font-bold mb-1">{topic.title}</h3>
         <p className="text-sm text-white/70 line-clamp-1">{topic.description}</p>
      </div>
    </div>
  );
};