import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Loader2, Plus, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import type { CompassCapabilityResponse } from '@ns/shared';
import type { Tool } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useShare } from '@/hooks/useShare';
import { SITE_URL } from '../constants/ui';
import { generateSolutionWithAI } from '@/services/AIService';
import { compassApi, platformApi } from '@/services/api';

export const SolutionNewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    themeMode,
    authToken,
    getSelectedToolIdsArray,
    toggleToolSelection,
    clearSelection,
  } = useAppStore();

  const toolIds = getSelectedToolIdsArray();
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolLoadError, setToolLoadError] = useState('');
  const [capabilities, setCapabilities] = useState<CompassCapabilityResponse | null>(null);
  const selectedTools = tools.filter((t) => toolIds.includes(t.id));
  const [goal, setGoal] = useState('');

  useEffect(() => {
    let cancelled = false;
    compassApi
      .listTools()
      .then((result) => {
        if (!cancelled) setTools(result.items);
      })
      .catch((error) => {
        if (!cancelled) setToolLoadError(error instanceof Error ? error.message : '工具列表加载失败，请稍后重试。');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    platformApi
      .getCompassCapabilities()
      .then((result) => {
        if (!cancelled) setCapabilities(result);
      })
      .catch(() => {
        if (!cancelled) setCapabilities(null);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const suggestedTools = useMemo(() => {
    const normalizedGoal = goal.trim().toLowerCase();
    const remainingTools = tools.filter((tool) => !toolIds.includes(tool.id));
    if (!normalizedGoal) return remainingTools.slice(0, 3);

    return remainingTools
      .map((tool) => {
        const text = `${tool.name} ${tool.description} ${tool.domain} ${tool.tags.join(' ')}`.toLowerCase();
        const score = normalizedGoal
          .split(/\s+/)
          .filter(Boolean)
          .reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
        return { tool, score };
      })
      .sort((a, b) => b.score - a.score || (b.tool.rating ?? 0) - (a.tool.rating ?? 0))
      .map((item) => item.tool)
      .slice(0, 3);
  }, [goal, toolIds, tools]);

  const [isGenerating, setIsGenerating] = useState(false);
  const { copied, copyText } = useShare();

  const isEyeCare = themeMode === 'eye-care';

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'error' | ''>('');

  const handleGenerate = async () => {
    if (!authToken) {
      setStatusMessage('请先登录后再生成并保存私有方案。');
      setStatusType('error');
      return;
    }
    if (capabilities && !capabilities.canGenerateSolution) {
      setStatusMessage(capabilities.lockedReason || '当前账号暂未开放方案生成。');
      setStatusType('error');
      return;
    }
    if (capabilities && !capabilities.canSaveSolution) {
      setStatusMessage(capabilities.lockedReason || '当前账号暂未开放方案保存。');
      setStatusType('error');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('');
    setStatusType('');

    try {
      const effectiveGoal = goal.trim() || '探索这些工具的组合潜力';
      const finalResult = await generateSolutionWithAI(effectiveGoal, selectedTools);

      if (finalResult.mode === 'demo') {
        setStatusMessage(
          finalResult.fallbackReason === 'quota_exhausted'
            ? '演示模式：AI 额度已用完，已提供不消耗额度的基础方案草稿。'
            : '演示模式：AI 服务不可用，已提供基础方案草稿。'
        );
        setStatusType('info');
      }

      const savedSolution = await compassApi.createSolution({
        title: finalResult.title,
        targetGoal: effectiveGoal,
        toolIds,
        content: finalResult.aiAdvice,
      });
      clearSelection();
      navigate(`/solution/${savedSolution.id}`);
    } catch (error) {
      console.error('AI 方案生成失败:', error);
      setStatusMessage('AI 请求失败。请检查网络或稍后重试，本次未保存任何方案。');
      setStatusType('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    const textToShare = `【盘根 AI 方案生成】\n已选工具：${
      selectedTools.length ? selectedTools.map((t) => t.name).join(' + ') : '暂未选择，先从目标开始'
    }\n目标：${goal || '探索工具组合潜力'}\n\n快来体验：${SITE_URL}`;
    copyText(textToShare);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in slide-in-from-bottom-4 fade-in">
      <button
        onClick={() => navigate('/')}
        className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft size={16} /> 返回首页
      </button>
      <div
        className={`p-8 rounded-3xl ${
          isEyeCare
            ? 'bg-[#FDFCF8] shadow-sm ring-1 ring-stone-200'
            : 'bg-white shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-bold">生成 AI 解决方案</h2>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="复制内容分享"
          >
            {copied ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckSquare size={16} /> 已复制
              </span>
            ) : (
              <>
                <Share2 size={18} />
                <span className="hidden sm:inline">分享</span>
              </>
            )}
          </button>
        </div>

        <div className="mb-4 flex justify-end">
          <div className={`text-xs ${isEyeCare ? 'text-stone-600' : 'text-slate-500'}`}>
            当前方案额度：{capabilities?.solutionRemaining ?? '读取中'}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 flex items-start gap-2 rounded-xl px-4 py-3 border ${
              statusType === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-100'
                : 'bg-amber-50 text-amber-800 border-amber-100'
            }`}
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm font-medium leading-relaxed">{statusMessage}</div>
          </div>
        )}

        {toolLoadError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="text-sm font-medium leading-relaxed">{toolLoadError}</div>
          </div>
        )}

        {capabilities && capabilities.solutionRemaining <= 0 && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 px-4 py-3 border border-amber-100">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm font-medium">
              当前 AI 方案额度已用完。可在“我的额度”创建手动订单，后台确认后发放额度。
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
            工具上下文
          </label>
          {selectedTools.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTools.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700"
                >
                  <img
                    src={t.imageUrl}
                    className="w-5 h-5 rounded-full object-cover"
                    alt=""
                  />
                  {t.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              可以不选工具直接生成方案。系统会先按目标拆解主工具、辅助工具和校验工具。
            </div>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
            您的目标
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例如：我想做一个可以持续更新的小红书选题和图文生产流程..."
            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
          />
        </div>

        {suggestedTools.length > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-bold text-slate-700">可加入方案的候选工具</div>
            <div className="space-y-2">
              {suggestedTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => toggleToolSelection(tool.id)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left transition-colors hover:bg-blue-50"
                >
                  <img src={tool.imageUrl} className="h-9 w-9 rounded-lg object-cover" alt={tool.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-800">{tool.name}</span>
                    <span className="line-clamp-1 text-xs text-slate-500">{tool.description}</span>
                  </span>
                  <Plus size={16} className="text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" /> 正在思考...
            </>
          ) : (
            <>
              <Sparkles /> 生成方案
            </>
          )}
        </button>
      </div>
    </div>
  );
};
