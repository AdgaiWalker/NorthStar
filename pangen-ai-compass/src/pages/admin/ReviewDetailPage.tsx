import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Code, Bot, Check, X, Loader2 } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { DocRenderer } from '../../components/DocRenderer';
import { ReviewTaskStatus } from '../../types/review';

type ViewMode = 'preview' | 'raw';

const STATUS_LABEL: Record<ReviewTaskStatus, string> = {
  pending_review: '待审核',
  assigned: '已分配',
  in_review: '审核中',
  approved: '已通过',
  rejected: '已退回',
  revision: '修订中',
  unassigned: '待分配池',
};

const STATUS_COLOR: Record<ReviewTaskStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-700',
  assigned: 'bg-sky-100 text-sky-700',
  in_review: 'bg-violet-100 text-violet-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  revision: 'bg-slate-100 text-slate-600',
  unassigned: 'bg-orange-100 text-orange-700',
};

const formatDate = (ts?: number) =>
  ts ? new Date(ts).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

// 模拟 AI 输出
const mockAiSummary = (content: string) =>
  `本文共 ${content.length} 字，主要介绍了“xxx”的实操方法和注意事项。`;

const mockRejectReason = () =>
  `拒绝原因：
1. 标题不够具体，建议补充“xxx”关键词。
2. 正文缺少操作步骤截图。
3. 结尾请添加总结段落。`;

const mockRevisionContent = (content: string) =>
  content + `\n\n## 总结\n\u672c文介绍了 xxx 的实操方法，请根据实际需求调整。`;

const mockRiskScan = () => `风险扫描结果：\n- 未发现敏感词\n- 未发现涉外链接`;

export const ReviewDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const {
    tasks,
    reviewers,
    startReview,
    approveTask,
    rejectTask,
    submitRevision,
    writeAudit,
  } = useReviewStore();

  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<{ type: string; text: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const task = tasks.find((t) => t.id === taskId);
  const assignee = task?.assignedTo ? reviewers.find((r) => r.id === task.assignedTo) : null;

  if (!task) {
    return <div className="text-center py-20 text-slate-400">未找到审核任务 {taskId}</div>;
  }

  const runAi = (type: string) => {
    setAiLoading(true);
    setAiOutput(null);
    setTimeout(() => {
      let text = '';
      if (type === 'summary') text = mockAiSummary(task.content);
      else if (type === 'reject') text = mockRejectReason();
      else if (type === 'revision') text = mockRevisionContent(task.content);
      else if (type === 'risk') text = mockRiskScan();
      setAiOutput({ type, text });
      setAiLoading(false);
      writeAudit('ai_run', task.id, task.title, `模块: ${type}`);
    }, 800);
  };

  const handleApplyReject = () => {
    if (aiOutput?.type === 'reject') {
      setRejectReason(aiOutput.text);
      writeAudit('ai_apply', task.id, task.title, '填入退回理由');
    }
  };

  const handleCreateRevision = () => {
    if (aiOutput?.type === 'revision') {
      submitRevision(task.id, aiOutput.text);
      writeAudit('ai_apply', task.id, task.title, '创建修订版本');
      navigate('/admin/review-queue');
    }
  };

  const handleApprove = () => {
    approveTask(task.id);
    navigate('/admin/review-queue');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectTask(task.id, rejectReason);
    navigate('/admin/review-queue');
  };

  const handleStartReview = () => {
    startReview(task.id);
  };

  const canOperate = ['assigned', 'in_review'].includes(task.status);

  return (
    <div className="flex gap-6">
      {/* 主区域 */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => navigate('/admin/review-queue')}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm mb-4"
        >
          <ArrowLeft size={14} /> 返回队列
        </button>

        <header className="mb-6">
          <h1 className="text-xl font-bold">{task.title}</h1>
          <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-4">
            <span>作者: {task.authorName}</span>
            <span>提交: {formatDate(task.createdAt)}</span>
            {assignee && <span>审核员: {assignee.name}</span>}
            <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[task.status]}`}>
              {STATUS_LABEL[task.status]}
            </span>
          </div>
        </header>

        {task.status === 'assigned' && (
          <div className="mb-4">
            <button
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
              onClick={handleStartReview}
            >
              开始审核
            </button>
          </div>
        )}

        {/* 视图切换 */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
              viewMode === 'preview'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Eye size={14} /> 预览
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
              viewMode === 'raw'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Code size={14} /> Markdown
          </button>
          <button
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
              aiPanelOpen
                ? 'bg-teal-50 text-teal-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bot size={14} /> AI 助手
          </button>
        </div>

        {/* 内容区 */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white min-h-[400px]">
          {viewMode === 'preview' ? (
            <article className="prose prose-sm max-w-none">
              <DocRenderer markdown={task.content} />
            </article>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
              {task.content}
            </pre>
          )}
        </div>

        {/* 退回理由输入 */}
        {canOperate && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">退回理由</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm"
              rows={4}
              placeholder="请输入退回理由…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        )}

        {/* 操作按钮 */}
        {canOperate && (
          <div className="flex items-center gap-4 mt-4">
            <button
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-1"
              onClick={handleApprove}
            >
              <Check size={16} /> 批准发布
            </button>
            <button
              className="px-5 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              <X size={16} /> 退回修改
            </button>
          </div>
        )}
      </div>

      {/* AI 助手侧边面板 */}
      {aiPanelOpen && (
        <aside className="w-80 shrink-0 border border-slate-200 rounded-xl bg-white p-4 self-start sticky top-20">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={18} className="text-teal-600" />
            <span className="font-bold text-sm">AI 审核助手</span>
          </div>
          <div className="space-y-2">
            <button
              className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => runAi('summary')}
              disabled={aiLoading}
            >
              一键摘要
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => runAi('reject')}
              disabled={aiLoading}
            >
              生成退回理由
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => runAi('revision')}
              disabled={aiLoading}
            >
              生成修订版本
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
              onClick={() => runAi('risk')}
              disabled={aiLoading}
            >
              风险扫描
            </button>
          </div>

          {aiLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> AI 处理中…
            </div>
          )}

          {aiOutput && (
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-1">AI 输出</div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm whitespace-pre-wrap border border-slate-200 max-h-60 overflow-y-auto">
                {aiOutput.text}
              </div>
              <div className="flex gap-2 mt-2">
                {aiOutput.type === 'reject' && (
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    onClick={handleApplyReject}
                  >
                    填入退回理由
                  </button>
                )}
                {aiOutput.type === 'revision' && (
                  <button
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                    onClick={handleCreateRevision}
                  >
                    创建修订版本
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">
            AI 输出仅供参考，最终内容需审核员确认。
          </div>
        </aside>
      )}
    </div>
  );
};
