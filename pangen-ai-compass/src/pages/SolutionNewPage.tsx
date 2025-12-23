import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Loader2, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import { UserSolution } from '../types';
import { MOCK_TOOLS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useShare } from '../hooks/useShare';
import { SITE_URL } from '../constants/ui';
import { generateSolutionWithAI, buildFallbackSolution } from '../services/AIService';
import { DAILY_GUEST_QUOTA_LIMITS, consumeGuestQuota, getGuestQuotaState } from '../utils/quota';

export const SolutionNewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    themeMode,
    getSelectedToolIdsArray,
    saveSolution,
    clearSelection,
  } = useAppStore();

  const toolIds = getSelectedToolIdsArray();
  const selectedTools = MOCK_TOOLS.filter((t) => toolIds.includes(t.id));

  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { copied, copyText } = useShare();

  // 游客额度：用于展示与拦截
  const [quotaState, setQuotaState] = useState(() => getGuestQuotaState());

  const isEyeCare = themeMode === 'eye-care';

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'error' | ''>('');

  // 如果没有选中工具，引导用户返回首页
  if (toolIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-slate-400 mb-4">
          <Sparkles size={48} className="mx-auto opacity-50" />
        </div>
        <h2 className="text-xl font-bold mb-2">请先选择工具</h2>
        <p className="text-slate-500 mb-6">返回首页，选择你感兴趣的 AI 工具，然后生成方案。</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          去首页选工具
        </button>
      </div>
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('');
    setStatusType('');

    try {
      const effectiveGoal = goal.trim() || '探索这些工具的组合潜力';
      const quota = getGuestQuotaState();

      // 额度耗尽：直接使用演示模式结果，不中断流程
      const finalResult =
        quota.aiSolutionRemaining <= 0
          ? buildFallbackSolution('quota_exhausted', effectiveGoal, selectedTools)
          : await generateSolutionWithAI(effectiveGoal, selectedTools);

      if (finalResult.mode === 'ai') {
        consumeGuestQuota('aiSolution', 1);
      }
      setQuotaState(getGuestQuotaState());

      if (finalResult.mode === 'demo') {
        setStatusMessage(
          finalResult.fallbackReason === 'quota_exhausted'
            ? '演示模式：今日 AI 方案额度已用完，已为你提供不消耗次数的方案草稿。明日 00:00 自动恢复。'
            : '演示模式：AI 服务不可用，已提供基础方案草稿。'
        );
        setStatusType('info');
      }

      const newSolution: UserSolution = {
        id: Date.now().toString(),
        title: finalResult.title,
        targetGoal: effectiveGoal,
        toolIds: toolIds,
        aiAdvice: finalResult.aiAdvice,
        createdAt: new Date().toLocaleDateString(),
      };

      saveSolution(newSolution);
      clearSelection();
      navigate('/me/solutions');
    } catch (error) {
      console.error('AI 方案生成失败:', error);
      setStatusMessage('AI 请求失败。请检查网络或稍后重试，本次未保存任何方案。');
      setStatusType('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    const textToShare = `【盘根 AI 方案生成】\n已选工具：${selectedTools
      .map((t) => t.name)
      .join(' + ')}\n目标：${goal || '探索工具组合潜力'}\n\n快来体验：${SITE_URL}`;
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
            今日额度：AI 搜索 {quotaState.aiSearchRemaining}/{DAILY_GUEST_QUOTA_LIMITS.aiSearch} · 方案 {quotaState.aiSolutionRemaining}/{DAILY_GUEST_QUOTA_LIMITS.aiSolution}
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

        {quotaState.aiSolutionRemaining <= 0 && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 px-4 py-3 border border-amber-100">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm font-medium">
              今日 AI 方案额度已用完。请明日 00:00 后重试（额度会重置）。
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
            已选工具
          </label>
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
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
            您的目标
          </label>
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
