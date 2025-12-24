import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Lock, GraduationCap } from 'lucide-react';
import { MOCK_ARTICLES, MOCK_TOOLS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { ArticleCard } from '../components/CardComponents';

export const ToolDetailPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { themeMode, isToolFavorited, toggleFavoriteTool, studentCertification } = useAppStore();

  const tool = MOCK_TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-slate-400 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> 返回
        </button>
        <div className="text-center py-20 text-slate-400">未找到该工具</div>
      </div>
    );
  }

  const relatedArticles = MOCK_ARTICLES.filter((a) => a.relatedToolId === tool.id);
  const isEyeCare = themeMode === 'eye-care';
  const isFavorited = isToolFavorited(tool.id);

  // 校内内容访问控制
  const isCampusContent = tool.visibility === 'campus';
  const canAccess = !isCampusContent || (
    studentCertification.status === 'verified' &&
    studentCertification.schoolId === tool.schoolId
  );

  // 校内内容无权访问时展示锁定态
  if (isCampusContent && !canAccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div className={`p-8 rounded-2xl ${isEyeCare ? 'bg-[#FDFCF8] border border-stone-200' : 'bg-white shadow-lg'}`}>
          <Lock size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold mb-2">校内专属内容</h2>
          <p className="text-sm text-slate-500 mb-6">该工具仅对认证通过的学生开放，请先完成学生认证。</p>
          <button
            onClick={() => navigate('/me/certification')}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <GraduationCap size={18} /> 去学生认证
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-slate-400 hover:text-slate-600"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-1" /> 返回
      </button>

      <div
        className={`rounded-3xl overflow-hidden mb-8 ${
          isEyeCare ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-xl'
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
            <button
              onClick={() => toggleFavoriteTool(tool.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                isFavorited
                  ? 'bg-pink-50 border border-pink-200 text-pink-600'
                  : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Heart size={18} className={isFavorited ? 'fill-pink-500' : ''} />
              {isFavorited ? '已收藏' : '收藏'}
            </button>
          </div>

          {relatedArticles.length > 0 && (
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-xl font-bold mb-6">相关教程与实战</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedArticles.map((a) => (
                  <ArticleCard
                    key={a.id}
                    article={a}
                    onClick={() => navigate(`/article/${a.id}`)}
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
