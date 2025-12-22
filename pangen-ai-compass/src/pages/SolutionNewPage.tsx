import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Loader2, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import { UserSolution } from '../types';
import { MOCK_TOOLS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useShare } from '../hooks/useShare';
import { SITE_URL } from '../constants/ui';
import { generateSolutionWithAI } from '../services/AIService';

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

  const isEyeCare = themeMode === 'eye-care';

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

  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsDemoMode(false);

    try {
      const effectiveGoal = goal.trim() || '探索这些工具的组合潜力';
      
      // 调用真实 AI 方案生成
      const result = await generateSolutionWithAI(effectiveGoal, selectedTools);
      
      if (result.mode === 'demo') {
        setIsDemoMode(true);
      }

      const newSolution: UserSolution = {
        id: Date.now().toString(),
        title: result.title,
        targetGoal: effectiveGoal,
        toolIds: toolIds,
        aiAdvice: result.aiAdvice,
        createdAt: new Date().toLocaleDateString(),
      };
      
      saveSolution(newSolution);
      clearSelection();
      navigate('/me/solutions');
    } catch (error) {
      console.error('AI 方案生成失败:', error);
      // 即使失败也生成默认方案
      const effectiveGoal = goal.trim() || '探索这些工具的组合潜力';
      const fallbackSolution: UserSolution = {
        id: Date.now().toString(),
        title: `方案: ${selectedTools.map((t) => t.name).join(' + ')}`,
        targetGoal: effectiveGoal,
        toolIds: toolIds,
        aiAdvice: `### 生成失败\n\n抱歉，AI 服务暂时不可用。请稍后重试。\n\n#### 已选工具\n${selectedTools.map(t => `- **${t.name}**`).join('\n')}`,
        createdAt: new Date().toLocaleDateString(),
      };
      saveSolution(fallbackSolution);
      clearSelection();
      navigate('/me/solutions');
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
