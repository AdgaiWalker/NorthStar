import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ExternalLink, Heart, LoaderCircle } from 'lucide-react';
import type { Article, Tool } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ArticleCard } from '../components/CardComponents';
import { compassApi } from '@/services/api';

type ToolLoadState = {
  key: string;
  tool: Tool | null;
  relatedArticles: Article[];
  error: string;
};

export const ToolDetailPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { themeMode, authToken, isToolFavorited, setFavoriteToolIds } = useAppStore();
  const [favoriteError, setFavoriteError] = useState('');
  const [loadState, setLoadState] = useState<ToolLoadState>({
    key: '',
    tool: null,
    relatedArticles: [],
    error: '',
  });

  useEffect(() => {
    if (!toolId) return;
    let cancelled = false;

    Promise.all([compassApi.getTool(toolId), compassApi.listArticles()])
      .then(([toolResult, articleResult]) => {
        if (cancelled) return;
        setLoadState({
          key: toolId,
          tool: toolResult,
          relatedArticles: articleResult.items.filter((article) => article.relatedToolId === toolResult.id),
          error: '',
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadState({
            key: toolId,
            tool: null,
            relatedArticles: [],
            error: err instanceof Error ? err.message : '工具详情加载失败，请稍后重试。',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [toolId]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    compassApi
      .listFavorites()
      .then((result) => {
        if (!cancelled) {
          setFavoriteToolIds(result.items.filter((item) => item.targetType === 'tool').map((item) => item.targetId));
        }
      })
      .catch(() => {
        if (!cancelled) setFavoriteError('收藏状态同步失败，请稍后重试。');
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, setFavoriteToolIds]);

  const tool = loadState.tool;
  const relatedArticles = loadState.relatedArticles;
  const error = !toolId ? '缺少工具 ID。' : loadState.error;
  const loading = Boolean(toolId) && loadState.key !== toolId;
  const isEyeCare = themeMode === 'eye-care';

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          正在加载工具详情...
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft size={18} className="mr-1" /> 返回
        </button>
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error || '未找到该工具。'}
        </div>
      </div>
    );
  }

  const isFavorited = isToolFavorited(tool.id);
  const toggleFavorite = async () => {
    if (!authToken) {
      navigate('/login');
      return;
    }

    setFavoriteError('');
    try {
      if (isFavorited) {
        await compassApi.removeFavorite({ targetType: 'tool', targetId: tool.id });
        setFavoriteToolIds(Array.from(useAppStore.getState().favoriteToolIds).filter((id) => id !== tool.id));
      } else {
        await compassApi.addFavorite({ targetType: 'tool', targetId: tool.id });
        setFavoriteToolIds([...Array.from(useAppStore.getState().favoriteToolIds), tool.id]);
      }
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : '收藏操作失败，请稍后重试。');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center text-slate-400 transition-colors hover:text-slate-700"
      >
        <ArrowLeft size={18} className="mr-1" /> 返回
      </button>

      <div
        className={`mb-8 overflow-hidden rounded-3xl ${
          isEyeCare ? 'bg-[#FDFCF8] shadow-sm' : 'bg-white shadow-xl'
        }`}
      >
        <div className="relative h-64 w-full bg-slate-100 md:h-80">
          <img src={tool.imageUrl} alt={tool.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent">
            <div className="p-8 text-white">
              <h1 className="mb-2 text-4xl font-bold">{tool.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="rounded bg-white/20 px-2 py-1 backdrop-blur-md">评分 {tool.rating}</span>
                <span className="rounded bg-white/20 px-2 py-1">{tool.usageCount} 人使用</span>
                <span className="rounded bg-blue-600 px-2 py-1">{tool.domain}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="mb-8 text-lg leading-relaxed">{tool.fullDescription}</p>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-500/30"
            >
              访问官网 <ExternalLink size={18} />
            </a>
            <button
              onClick={toggleFavorite}
              className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                isFavorited
                  ? 'border border-pink-200 bg-pink-50 text-pink-600'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart size={18} className={isFavorited ? 'fill-pink-500' : ''} />
              {isFavorited ? '已收藏' : '收藏'}
            </button>
          </div>

          {favoriteError && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {favoriteError}
            </div>
          )}

          {relatedArticles.length > 0 && (
            <div className="border-t border-slate-100 pt-8">
              <h3 className="mb-6 text-xl font-bold">相关教程与实战</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {relatedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => navigate(`/article/${article.id}`)}
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
