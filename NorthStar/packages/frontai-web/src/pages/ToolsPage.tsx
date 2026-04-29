import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Users,
  ExternalLink,
  Heart,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  Zap,
  ArrowRight,
  Filter,
  X,
} from 'lucide-react';
import type { Tool, Article } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ToolCard } from '../components/CardComponents';
import { compassApi } from '@/services/api';
import { LoaderCircle, AlertTriangle, Search } from 'lucide-react';

type FilterCategory = 'all' | 'creative' | 'dev' | 'work';
type SortOption = 'trending' | 'rating' | 'popular' | 'newest';

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: '全部工具',
  creative: '创意设计',
  dev: '开发编程',
  work: '效率办公',
};

const SORT_LABELS: Record<SortOption, string> = {
  trending: '趋势推荐',
  rating: '评分最高',
  popular: '使用最多',
  newest: '最新上架',
};

export const ToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, isToolFavorited, toggleFavoriteTool, isLoggedIn, setFavoriteToolIds } = useAppStore();

  const [tools, setTools] = useState<Tool[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [featuredTool, setFeaturedTool] = useState<Tool | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([compassApi.listTools(), compassApi.listArticles()])
      .then(([toolResult, articleResult]) => {
        if (cancelled) return;
        setTools(toolResult.items);
        setArticles(articleResult.items);
        // Set the highest-rated tool as featured
        const topTool = [...toolResult.items].sort((a, b) => b.rating - a.rating)[0];
        setFeaturedTool(topTool || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '工具数据加载失败，请稍后重试。');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    compassApi
      .listFavorites()
      .then((result) => {
        const toolIds = result.items.filter((f) => f.targetType === 'tool').map((f) => f.targetId);
        setFavoriteToolIds(toolIds);
      })
      .catch(() => {});
  }, [isLoggedIn, setFavoriteToolIds]);

  const filteredTools = tools
    .filter((tool) => selectedCategory === 'all' || tool.domain === selectedCategory)
    .sort((a, b) => {
      switch (selectedSort) {
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return parseInt(b.usageCount) - parseInt(a.usageCount);
        case 'trending':
          // Combine rating and usage for trending
          return b.rating * parseInt(b.usageCount) - a.rating * parseInt(a.usageCount);
        default:
          return 0;
      }
    });

  const handleToggleFavorite = async (toolId: string) => {
    try {
      if (isToolFavorited(toolId)) {
        await compassApi.removeFavorite({ targetType: 'tool', targetId: toolId });
      } else {
        await compassApi.addFavorite({ targetType: 'tool', targetId: toolId });
      }
      toggleFavoriteTool(toolId);
    } catch {}
  };

  const getRelatedTools = (currentTool: Tool, count: number = 4) => {
    return tools
      .filter((t) => t.id !== currentTool.id && (t.domain === currentTool.domain || t.tags.some((tag) => currentTool.tags.includes(tag))))
      .slice(0, count);
  };

  const getRelatedArticles = (toolId: string) => {
    return articles.filter((article) => article.relatedToolId === toolId).slice(0, 3);
  };

  const isEyeCare = themeMode === 'eye-care';

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          正在加载工具展览...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      {/* Hero Section - Featured Tool */}
      {featuredTool && (
        <section className="relative mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-blue-600" size={20} />
              <span className="text-sm font-semibold text-blue-600">本周推荐</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer"
                onClick={() => navigate(`/tool/${featuredTool.id}`)}>
                <div className="aspect-[16/10] lg:aspect-[16/9] relative">
                  <img
                    src={featuredTool.imageUrl}
                    alt={featuredTool.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {CATEGORY_LABELS[featuredTool.domain as FilterCategory]}
                      </span>
                      <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold">{featuredTool.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded">
                        <Users size={14} />
                        <span className="text-sm">{featuredTool.usageCount}</span>
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">{featuredTool.name}</h2>
                    <p className="text-white/90 text-base line-clamp-2 mb-4">{featuredTool.fullDescription}</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={featuredTool.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                      >
                        访问官网 <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(featuredTool.id); }}
                        className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-colors"
                      >
                        <Heart size={16} className={isToolFavorited(featuredTool.id) ? 'fill-rose-500 text-rose-500' : ''} />
                        {isToolFavorited(featuredTool.id) ? '已收藏' : '收藏'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Content for Featured Tool */}
              <div className="flex flex-col gap-6">
                <div className={`rounded-2xl p-6 ${isEyeCare ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-lg'}`}>
                  <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                    <Award className="text-amber-500" size={20} />
                    推荐理由
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {featuredTool.name} 是 {CATEGORY_LABELS[featuredTool.domain as FilterCategory]} 领域中备受好评的工具，
                    评分高达 <span className="font-bold text-amber-600">{featuredTool.rating}</span> 分，
                    已有 <span className="font-bold">{featuredTool.usageCount}</span> 位用户在使用。
                    {featuredTool.tags.length > 0 && (
                      <> 适用于 {featuredTool.tags.slice(0, 2).join('、')} 等多种场景。</>
                    )}
                  </p>
                </div>

                {/* Related Articles */}
                {getRelatedArticles(featuredTool.id).length > 0 && (
                  <div className={`rounded-2xl p-6 ${isEyeCare ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-lg'}`}>
                    <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                      <Sparkles className="text-blue-500" size={20} />
                      相关教程
                    </h3>
                    <div className="space-y-3">
                      {getRelatedArticles(featuredTool.id).map((article) => (
                        <button
                          key={article.id}
                          onClick={() => navigate(`/article/${article.id}`)}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {article.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span>{article.readTime}</span>
                            <span>•</span>
                            <span>{article.stats.views} 浏览</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className={`rounded-2xl p-6 ${isEyeCare ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-lg'}`}>
                  <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                    <TrendingUp className="text-green-500" size={20} />
                    平台数据
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{tools.length}</div>
                      <div className="text-xs text-slate-500 mt-1">收录工具</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">
                        {articles.filter((a) => a.relatedToolId).length}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">相关教程</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter & Sort Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-600" size={20} />
            <h1 className="text-2xl font-bold">工具展览馆</h1>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : isEyeCare
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter size={16} />
            筛选与排序
          </button>
        </div>

        {showFilters && (
          <div className={`mt-6 p-6 rounded-2xl ${isEyeCare ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-lg'} animate-in fade-in slide-in-from-top-2 duration-300`}>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Category Filter */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700 mb-3">按领域筛选</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABELS) as FilterCategory[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white shadow-md'
                          : isEyeCare
                            ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {selectedCategory === category && <CheckCircle2 size={12} className="inline mr-1" />}
                      {CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700 mb-3">排序方式</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSelectedSort(sort)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedSort === sort
                          ? 'bg-purple-600 text-white shadow-md'
                          : isEyeCare
                            ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {SORT_LABELS[sort]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Active Filters Display */}
      {(selectedCategory !== 'all' || selectedSort !== 'trending') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">当前筛选：</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                {CATEGORY_LABELS[selectedCategory]}
                <button onClick={() => setSelectedCategory('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
            {selectedSort !== 'trending' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                {SORT_LABELS[selectedSort]}
                <button onClick={() => setSelectedSort('trending')} className="hover:bg-purple-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSort('trending');
              }}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              清除全部
            </button>
          </div>
        </section>
      )}

      {/* Tools Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {filteredTools.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="mb-4"><Search size={48} className="mx-auto text-slate-300" /></div>
            <p className="text-lg">没有找到匹配的工具</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => navigate(`/tool/${tool.id}`)}
                themeMode={themeMode}
                isFavorited={isToolFavorited(tool.id)}
                onToggleFavorite={() => handleToggleFavorite(tool.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className={`rounded-3xl p-8 md:p-12 text-center ${
          isEyeCare
            ? 'bg-[#FDFCF8] shadow-sm'
            : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl'
        }`}>
          <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${isEyeCare ? 'text-stone-800' : 'text-white'}`}>
            找不到合适的工具？
          </h2>
          <p className={`mb-6 ${isEyeCare ? 'text-stone-600' : 'text-white/90'}`}>
            使用 AI 搜索功能，告诉我们您的需求，智能推荐最适合的工具组合
          </p>
          <button
            onClick={() => navigate('/')}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg ${
              isEyeCare
                ? 'bg-stone-800 text-white hover:bg-stone-700'
                : 'bg-white text-blue-600 hover:bg-white/90'
            }`}
          >
            <Sparkles size={18} />
            开始 AI 搜索
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};
