import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';
import { ReviewerRole, WIP_LIMIT } from '@/types/review';

const ROLE_LABEL: Record<ReviewerRole, string> = {
  reviewer: '审核员',
  editor: '编辑',
  admin: '管理员',
};

const DOMAIN_LABEL: Record<string, string> = {
  dev: '开发',
  creative: '创作',
  work: '办公',
};

export const ReviewersPage: React.FC = () => {
  const { reviewers, addReviewer, pauseReviewer, resumeReviewer } = useReviewStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<ReviewerRole>('reviewer');
  const [newDomains, setNewDomains] = useState<('dev' | 'creative' | 'work')[]>(['dev']);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addReviewer({ name: newName.trim(), role: newRole, domains: newDomains });
    setNewName('');
    setNewRole('reviewer');
    setNewDomains(['dev']);
    setShowAdd(false);
  };

  const toggleDomain = (d: 'dev' | 'creative' | 'work') => {
    setNewDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={24} className="text-blue-600" /> 审核员管理
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          查看审核员列表、分配领域、当前负载，并可暂停/恢复接单或批量改派任务。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? '取消' : '添加审核员'}
        </button>
      </div>

      {showAdd && (
        <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-white">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="姓名"
              className="border border-slate-200 rounded px-3 py-2 text-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="border border-slate-200 rounded px-3 py-2 text-sm"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as ReviewerRole)}
            >
              <option value="reviewer">审核员</option>
              <option value="editor">编辑</option>
              <option value="admin">管理员</option>
            </select>
            <div className="flex items-center gap-2 text-sm">
              {(['dev', 'creative', 'work'] as const).map((d) => (
                <label key={d} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={newDomains.includes(d)}
                    onChange={() => toggleDomain(d)}
                  />
                  {DOMAIN_LABEL[d]}
                </label>
              ))}
            </div>
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
              onClick={handleAdd}
            >
              确认添加
            </button>
          </div>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">姓名</th>
              <th className="text-left px-4 py-3 font-medium">角色</th>
              <th className="text-left px-4 py-3 font-medium">负责领域</th>
              <th className="text-left px-4 py-3 font-medium">当前负载</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {reviewers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  暂无审核员数据
                </td>
              </tr>
            ) : (
              reviewers.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[r.role]}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.domains.map((d) => DOMAIN_LABEL[d]).join('、')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.wipCount >= WIP_LIMIT ? 'text-rose-600 font-semibold' : ''}>
                      {r.wipCount}/{WIP_LIMIT}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.isPaused ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-600">已暂停</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">正常</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.isPaused ? (
                      <button
                        className="text-blue-600 hover:underline text-sm"
                        onClick={() => resumeReviewer(r.id)}
                      >
                        恢复接单
                      </button>
                    ) : (
                      <button
                        className="text-amber-600 hover:underline text-sm"
                        onClick={() => pauseReviewer(r.id)}
                      >
                        暂停接单
                      </button>
                    )}
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
