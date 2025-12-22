import React, { useState } from 'react';
import { List } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { UnassignedReason } from '../../types/review';

const REASON_LABEL: Record<UnassignedReason, string> = {
  no_reviewer_available: '无可用审核员',
  all_reviewers_over_capacity: '审核员已满载',
  no_reviewer_for_domain: '无该领域审核员',
  policy_blocked: '策略阻止',
};

const formatDate = (ts?: number) => (ts ? new Date(ts).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' }) : '-');

export const UnassignedPoolPage: React.FC = () => {
  const { tasks, reviewers, assignTask } = useReviewStore();
  const [selectedReviewer, setSelectedReviewer] = useState<Record<string, string>>({});

  const unassigned = tasks.filter((t) => t.status === 'unassigned');
  const availableReviewers = reviewers.filter((r) => !r.isPaused && r.wipCount < 10);

  const handleAssign = (taskId: string) => {
    const rid = selectedReviewer[taskId];
    if (!rid) return;
    assignTask(taskId, rid);
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <List size={24} className="text-blue-600" /> 待分配池
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          审核任务因"无可用审核员"或"审核员已满载"等原因进入此池，管理员可手动分配或等待系统自动恢复。
        </p>
      </header>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium">进入原因</th>
              <th className="text-left px-4 py-3 font-medium">进入时间</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {unassigned.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400">
                  暂无待分配任务
                </td>
              </tr>
            ) : (
              unassigned.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {t.unassignedReason ? REASON_LABEL[t.unassignedReason] : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.unassignedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        className="border border-slate-200 rounded px-2 py-1 text-sm"
                        value={selectedReviewer[t.id] || ''}
                        onChange={(e) => setSelectedReviewer({ ...selectedReviewer, [t.id]: e.target.value })}
                      >
                        <option value="">选择审核员</option>
                        {availableReviewers.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.wipCount}/10)
                          </option>
                        ))}
                      </select>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        disabled={!selectedReviewer[t.id]}
                        onClick={() => handleAssign(t.id)}
                      >
                        分配
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
