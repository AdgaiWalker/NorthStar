import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { ReviewTaskStatus } from '../../types/review';
import { canReassignTask, getCurrentReviewerRole } from '../../utils/reviewPermissions';

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

const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' });

export const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, reviewers, submitTask, addReviewer, currentUserId } = useReviewStore();
  const currentRole = getCurrentReviewerRole(reviewers, currentUserId);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // 过滤（不显示 unassigned，那个在待分配池页）
  const filtered = tasks.filter((t) => {
    if (t.status === 'unassigned') return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (typeFilter && t.contentType !== typeFilter) return false;
    return true;
  });

  const seedDemoData = () => {
    if (reviewers.length === 0) {
      addReviewer({ name: '张编辑', role: 'editor', domains: ['dev', 'creative', 'work'] });
      addReviewer({ name: '李审核', role: 'reviewer', domains: ['dev'] });
      addReviewer({ name: '王审核', role: 'reviewer', domains: ['creative', 'work'] });
    }
    submitTask({
      title: '示例文章：如何使用 Cursor',
      contentType: 'article',
      domain: 'dev',
      authorId: 'author1',
      authorName: '投稿者A',
      content: '# 正文\n\n这是正文内容……',
    });
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Inbox size={24} className="text-blue-600" /> 审核队列
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          查看分配给你或全部审核任务，进行内容审核、批准或退回。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="pending_review">待审核</option>
          <option value="assigned">已分配</option>
          <option value="in_review">审核中</option>
          <option value="approved">已通过</option>
          <option value="rejected">已退回</option>
        </select>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">全部类型</option>
          <option value="article">文章</option>
          <option value="tool">工具推荐</option>
          <option value="video_doc">视频文档</option>
        </select>
        <button
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
          onClick={seedDemoData}
        >
          生成演示数据
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium">作者</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">提交时间</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  暂无审核任务
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{t.authorName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        className="text-blue-600 hover:underline text-sm"
                        onClick={() => navigate(`/admin/review/${t.id}`)}
                      >
                        查看
                      </button>
                      {canReassignTask(t.status, currentRole) && (
                        <button
                          className="text-amber-700 hover:underline text-sm"
                          onClick={() => navigate(`/admin/review/${t.id}?reassign=1`)}
                        >
                          更改指派
                        </button>
                      )}
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
