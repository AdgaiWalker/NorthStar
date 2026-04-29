import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, ArrowLeft, Download, LoaderCircle, MessageSquare, Sparkles, Trash2 } from 'lucide-react';
import type { ExportFormat, SolutionRecord, Tool } from '@ns/shared';
import { compassApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

type LoadState = {
  solution: SolutionRecord | null;
  tools: Tool[];
  loadedSolutionId: string;
  error: string;
};

export const SolutionDetailPage: React.FC = () => {
  const { solutionId } = useParams<{ solutionId: string }>();
  const missingSolutionId = !solutionId;
  const navigate = useNavigate();
  const { themeMode, authToken } = useAppStore();
  const [state, setState] = useState<LoadState>({
    solution: null,
    tools: [],
    loadedSolutionId: '',
    error: missingSolutionId ? '缺少方案 ID。' : '',
  });
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    if (missingSolutionId) {
      return;
    }

    let cancelled = false;

    Promise.all([compassApi.getSolution(solutionId), compassApi.listTools()])
      .then(([solution, toolResult]) => {
        if (!cancelled) {
          setState({ solution, tools: toolResult.items, loadedSolutionId: solutionId, error: '' });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            solution: null,
            tools: [],
            loadedSolutionId: solutionId,
            error: error instanceof Error ? error.message : '方案详情加载失败，请稍后重试。',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, missingSolutionId, navigate, solutionId]);

  const isEyeCare = themeMode === 'eye-care';
  const isCurrentSolution = state.loadedSolutionId === solutionId;
  const isLoading = Boolean(solutionId) && !isCurrentSolution;
  const currentError = missingSolutionId ? '缺少方案 ID。' : isCurrentSolution ? state.error : '';
  const solution = isCurrentSolution ? state.solution : null;
  const selectedTools = useMemo(() => {
    if (!solution) return [];
    return solution.toolIds
      .map((id) => state.tools.find((tool) => tool.id === id))
      .filter((tool): tool is Tool => Boolean(tool));
  }, [solution, state.tools]);

  const exportSolution = async (format: ExportFormat) => {
    if (!solution) return;
    setActionError('');
    setActionMessage('');
    try {
      const content = await compassApi.exportSolution(solution.id, format);
      downloadTextFile(`${solution.title}.${format}`, content);
      setActionMessage('方案已导出。');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '方案导出失败，请稍后重试。');
    }
  };

  const submitFeedback = async (helpful: boolean) => {
    if (!solution) return;
    setActionError('');
    setActionMessage('');
    try {
      await compassApi.submitSolutionFeedback(solution.id, {
        helpful,
        note: helpful ? '详情页反馈：有用' : '详情页反馈：没用',
      });
      setActionMessage(helpful ? '已记录“有用”反馈。' : '已记录“没用”反馈。');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '反馈提交失败，请稍后重试。');
    }
  };

  const deleteSolution = async () => {
    if (!solution) return;
    setActionError('');
    try {
      await compassApi.deleteSolution(solution.id);
      navigate('/me/solutions');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '方案删除失败，请稍后重试。');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-in fade-in">
      <button
        onClick={() => navigate('/me/solutions')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        返回我的方案
      </button>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          正在加载方案详情...
        </div>
      )}

      {!isLoading && currentError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {currentError}
        </div>
      )}

      {!isLoading && solution && (
        <article
          className={`overflow-hidden rounded-2xl border ${
            isEyeCare ? 'border-stone-200 bg-[#FDFCF8]' : 'border-slate-200 bg-white'
          }`}
        >
          <header className="border-b border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                创建于 {new Date(solution.createdAt).toLocaleString('zh-CN')}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Sparkles size={12} />
                由 AI 生成，仅供参考
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{solution.title}</h1>
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              目标：{solution.targetGoal}
            </p>
          </header>

          <section className="border-b border-slate-100 p-6">
            <h2 className="mb-3 text-sm font-bold text-slate-500">关联工具</h2>
            {selectedTools.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => navigate(`/tool/${tool.id}`)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                该方案未绑定具体工具。
              </div>
            )}
          </section>

          <section className="prose prose-slate max-w-none p-6">
            <ReactMarkdown>{solution.content}</ReactMarkdown>
          </section>

          {(actionMessage || actionError) && (
            <div
              className={`mx-6 mb-4 rounded-xl px-4 py-3 text-sm ${
                actionError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {actionError || actionMessage}
            </div>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-6">
            <div className="flex flex-wrap gap-2">
              {(['md', 'txt', 'csv'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => void exportSolution(format)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download size={15} />
                  导出 {format.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void submitFeedback(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                <MessageSquare size={15} />
                有用
              </button>
              <button
                onClick={() => void submitFeedback(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                没用
              </button>
              <button
                onClick={() => void deleteSolution()}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={15} />
                删除
              </button>
            </div>
          </footer>
        </article>
      )}
    </div>
  );
};

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[\\/:*?"<>|]+/g, '-');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
