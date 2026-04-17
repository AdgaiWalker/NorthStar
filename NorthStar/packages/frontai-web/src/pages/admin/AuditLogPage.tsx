import React, { useState } from 'react';
import { FileCheck } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';
import { AuditAction } from '@/types/review';

const ACTION_LABEL: Record<AuditAction, string> = {
  submit: '提交',
  assign: '分配',
  reassign: '改派',
  start_review: '开始审核',
  approve: '批准',
  reject: '退回',
  revision_submit: '提交修订',
  ai_run: 'AI 运行',
  ai_apply: 'AI 应用',
  ai_rollback: 'AI 回滚',
  pause_reviewer: '暂停接单',
  resume_reviewer: '恢复接单',
  manual_unassign: '手动移入待分配池',
  auto_unassign: '自动移入待分配池',
};

const formatTime = (ts: number) => new Date(ts).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'medium' });

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useReviewStore();
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = auditLogs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        (log.taskId ?? '').toLowerCase().includes(q) ||
        (log.taskTitle ?? '').toLowerCase().includes(q) ||
        log.operatorName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck size={24} className="text-blue-600" /> 审计日志
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          记录任务分配、改派、批准、退回、AI 运行、修订创建等所有操作，便于追溯与合规。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">全部动作</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="搜索任务 ID / 操作人"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">时间</th>
              <th className="text-left px-4 py-3 font-medium">动作</th>
              <th className="text-left px-4 py-3 font-medium">任务</th>
              <th className="text-left px-4 py-3 font-medium">操作人</th>
              <th className="text-left px-4 py-3 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  暂无审计日志
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTime(log.timestamp)}</td>
                  <td className="px-4 py-3">{ACTION_LABEL[log.action] || log.action}</td>
                  <td className="px-4 py-3 text-slate-600">{log.taskTitle || log.taskId || '-'}</td>
                  <td className="px-4 py-3">{log.operatorName}</td>
                  <td className="px-4 py-3 text-slate-500">{log.note || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
