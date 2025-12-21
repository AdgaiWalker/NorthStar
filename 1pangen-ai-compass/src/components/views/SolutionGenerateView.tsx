import React, { useState } from 'react';
import { ArrowLeft, CheckSquare, Loader2, Share2, Sparkles } from 'lucide-react';
import { ThemeMode, UserSolution, ViewState } from '../../types';
import { MOCK_TOOLS } from '../../constants';
import { UI_DELAY, SITE_URL } from '@/constants/ui';
import { useShare } from '@/hooks/useShare';

interface SolutionGenerateViewProps {
  toolIds: string[];
  themeMode: ThemeMode;
  navigate: (view: ViewState) => void;
  onSaveSolution: (solution: UserSolution) => void;
}

export const SolutionGenerateView: React.FC<SolutionGenerateViewProps> = ({
  toolIds,
  themeMode,
  navigate,
  onSaveSolution,
}) => {
  const selectedTools = MOCK_TOOLS.filter(t => toolIds.includes(t.id));
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { copied, copyText } = useShare();

  const handleGenerate = () => {
    setIsGenerating(true);

    // Mock generation delay
    setTimeout(() => {
      setIsGenerating(false);
      const effectiveGoal = goal.trim() || '探索这些工具的通用组合潜力';
      const newSolution: UserSolution = {
        id: Date.now().toString(),
        title: `方案: ${selectedTools.map(t => t.name).join(' + ')}`,
        targetGoal: effectiveGoal,
        toolIds: toolIds,
        aiAdvice: `### AI 智能分析\n\n针对您的目标 **"${effectiveGoal}"**，我们分析了 **${selectedTools
          .map(t => t.name)
          .join(', ')}** 的组合潜力。\n\n#### 1. 工作流整合\n这些工具可以形成互补的工作流...\n\n#### 2. 关键优势\n- 效率提升\n- 创意扩展\n\n#### 3. 实施建议\n建议先从...`,
        createdAt: new Date().toLocaleDateString(),
      };
      onSaveSolution(newSolution);
    }, UI_DELAY.SOLUTION_GENERATE);
  };

  const handleShare = () => {
    const textToShare = `【盘根 AI 方案生成】\\n已选工具：${selectedTools
      .map(t => t.name)
      .join(' + ')}\\n目标：${goal || '探索工具组合潜力'}\\n\\n快来体验：${SITE_URL}`;
    copyText(textToShare);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in slide-in-from-bottom-4 fade-in">
      <button
        onClick={() => navigate({ type: 'home' })}
        className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft size={16} /> 返回首页
      </button>
      <div
        className={`p-8 rounded-3xl ${
          themeMode === 'eye-care' ? 'bg-[#FDFCF8] shadow-sm ring-1 ring-stone-200' : 'bg-white shadow-xl'
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
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">已选工具</label>
          <div className="flex flex-wrap gap-2">
            {selectedTools.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700"
              >
                <img src={t.imageUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">您的目标</label>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
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
