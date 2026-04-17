import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '@/store/useContentStore';
import type { ContentStatus, ContentVisibility, Domain } from '@/types';

type StatusFilter = 'all' | ContentStatus;
type DomainFilter = 'all' | Domain;
type VisibilityFilter = 'all' | ContentVisibility;

export const ContentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, publish, unpublish, delete: del } = useContentStore();

  const [status, setStatus] = useState<StatusFilter>('all');
  const [domain, setDomain] = useState<DomainFilter>('all');
  const [visibility, setVisibility] = useState<VisibilityFilter>('all');
  const [keyword, setKeyword] = useState('');

  const filteredItems = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items
      .filter((it) => (status === 'all' ? true : it.status === status))
      .filter((it) => (domain === 'all' ? true : it.domain === domain))
      .filter((it) => (visibility === 'all' ? true : it.visibility === visibility))
      .filter((it) => {
        if (!kw) return true;
        return `${it.title} ${it.summary}`.toLowerCase().includes(kw);
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [items, status, domain, visibility, keyword]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">内容管理</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
          onClick={() => navigate('/admin/content/new')}
        >
          新建文章
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <select className="px-3 py-2 border rounded-lg text-sm" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={domain} onChange={(e) => setDomain(e.target.value as DomainFilter)}>
          <option value="all">全部领域</option>
          <option value="creative">creative</option>
          <option value="dev">dev</option>
          <option value="work">work</option>
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}>
          <option value="all">全部可见性</option>
          <option value="public">public</option>
          <option value="campus">campus</option>
        </select>
        <input
          className="px-3 py-2 border rounded-lg text-sm"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="关键词（标题/摘要）"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">封面</th>
              <th className="text-left px-4 py-3">标题</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">领域</th>
              <th className="text-left px-4 py-3">可见性</th>
              <th className="text-left px-4 py-3">更新时间</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {it.coverImageUrl ? (
                    <img
                      src={it.coverImageUrl}
                      alt="cover"
                      className="w-12 h-8 object-cover rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-8 rounded bg-slate-100" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="text-slate-800 hover:underline font-medium"
                    onClick={() => navigate(`/admin/content/${it.id}/edit`)}
                  >
                    {it.title || '未命名文章'}
                  </button>
                </td>
                <td className="px-4 py-3">{it.status}</td>
                <td className="px-4 py-3">{it.domain}</td>
                <td className="px-4 py-3">{it.visibility}</td>
                <td className="px-4 py-3">{new Date(it.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {it.status === 'draft' ? (
                    <button className="px-3 py-1.5 text-white bg-green-600 rounded-md" onClick={() => publish(it.id)}>发布</button>
                  ) : (
                    <button className="px-3 py-1.5 text-slate-700 bg-slate-200 rounded-md" onClick={() => unpublish(it.id)}>下架</button>
                  )}
                  <button className="px-3 py-1.5 text-white bg-blue-600 rounded-md" onClick={() => navigate(`/admin/content/${it.id}/edit`)}>编辑</button>
                  <button className="px-3 py-1.5 text-white bg-rose-600 rounded-md" onClick={() => del(it.id)}>删除</button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-400" colSpan={7}>暂无内容，点击右上角“新建文章”。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};