import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Book, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { MOCK_TOOLS } from '../constants';
import { useContentStore } from '../store/useContentStore';
import { ToolCard, ArticleCard } from '../components/CardComponents';

export const CampusPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    themeMode,
    currentDomain,
    studentCertification,
    selectedToolIds,
    toggleToolSelection,
  } = useAppStore();

  const isEyeCare = themeMode === 'eye-care';
  const isVerified = studentCertification.status === 'verified';
  const userSchoolId = studentCertification.schoolId;

  // 校内内容过滤：只展示认证通过学校的内容
  const campusTools = MOCK_TOOLS.filter(
    (t) =>
      t.visibility === 'campus' &&
      t.domain === currentDomain &&
      t.schoolId === userSchoolId
  );
  const contentStore = useContentStore();
  const published = contentStore.getPublishedArticlesByDomain(currentDomain);
  const campusArticles = published
    .filter((a) => a.visibility === 'campus' && a.schoolId === userSchoolId)
    .map((it) => ({
      id: it.id,
      title: it.title,
      summary: it.summary,
      content: it.markdown,
      domain: it.domain,
      author: '站长',
      date: new Date(it.publishedAt || it.updatedAt).toLocaleDateString(),
      readTime: '3 min',
      imageUrl: it.coverImageUrl,
      isVideo: false,
      isFeatured: false,
      stats: { views: it.stats?.views ?? 0, likes: it.stats?.likes ?? 0, comments: 0 },
      visibility: it.visibility,
      schoolId: it.schoolId,
    }));

  // 未认证或认证未通过：展示锁定态
  if (!isVerified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div
          className={`p-8 rounded-2xl ${
            isEyeCare ? 'bg-[#FDFCF8] border border-stone-200' : 'bg-white shadow-lg'
          }`}
        >
          <Lock size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold mb-2">校内专区</h2>
          <p className="text-sm text-slate-500 mb-6">
            校内专区提供学校专属的 AI 工具与学习资源。
            <br />
            请先完成学生认证以解锁访问权限。
          </p>
          <button
            onClick={() => navigate('/me/certification')}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <GraduationCap size={18} /> 去学生认证
          </button>
        </div>
      </div>
    );
  }

  // 已认证：展示校内内容
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-bold">校内专区</h1>
        </div>
        <p className="text-sm text-slate-500">
          欢迎，{studentCertification.schoolName}的同学！以下是专属于你学校的 AI 资源。
        </p>
      </div>

      {/* 校内工具 */}
      {campusTools.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-blue-500" /> 校内工具
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {campusTools.map((tool) => (
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
        </section>
      )}

      {/* 校内文章 */}
      {campusArticles.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Book size={18} className="text-purple-500" /> 校内资源
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {campusArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                themeMode={themeMode}
                onClick={() => navigate(`/article/${article.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 空态 */}
      {campusTools.length === 0 && campusArticles.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
          <GraduationCap className="mx-auto mb-2 opacity-50" size={32} />
          <p>当前领域暂无校内专属内容</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 font-bold text-sm hover:underline"
          >
            去首页逛逛
          </button>
        </div>
      )}
    </div>
  );
};
