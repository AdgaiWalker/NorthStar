import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Star } from 'lucide-react';
import { KNOWLEDGE_BASES, getUser } from '@/data/mock';

const sectionOrder = ['热门', '商业', '最新'];

export default function KBListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allKBs = Object.values(KNOWLEDGE_BASES);
  const filteredKBs = query.trim()
    ? allKBs.filter(
        (kb) =>
          kb.name.includes(query) ||
          kb.desc.includes(query) ||
          getUser(kb.authorId).name.includes(query)
      )
    : allKBs;

  const sections: Record<string, typeof KNOWLEDGE_BASES[string][]> = {};
  filteredKBs.forEach((kb) => {
    if (!sections[kb.section]) sections[kb.section] = [];
    sections[kb.section].push(kb);
  });

  return (
    <div className="mx-auto max-w-content-max px-5 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-bold text-ink">知识库</h1>
        <p className="mt-1 text-sm text-ink-muted">按分类浏览校园知识</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索知识库..."
          className="h-11 w-full rounded-lg border border-border bg-bg-subtle pl-10 pr-4 text-sm text-ink outline-none transition-colors focus:border-sage focus:bg-white"
        />
      </div>

      {/* Sections */}
      <div className="space-y-8 pb-20">
        {filteredKBs.length === 0 && (
          <div className="py-12 text-center text-ink-muted">
            <p className="text-sm">未找到相关知识库</p>
            <p className="mt-1 text-xs">试试其他关键词</p>
          </div>
        )}
        {sectionOrder.map(
          (sec) =>
            sections[sec] && (
              <section key={sec}>
                <h2 className="mb-3.5 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                  <span className="h-4 w-[3px] rounded-full bg-sage" />
                  {sec}
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {sections[sec].map((kb) => (
                    <button
                      key={kb.id}
                      onClick={() => navigate(`/kb/${kb.id}`)}
                      className="relative overflow-hidden rounded-lg border border-border-light bg-surface p-5 text-left transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="mb-2.5 text-[28px]">{kb.icon}</div>
                      <div className="font-display text-base font-bold text-ink">
                        {kb.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} />
                          {kb.articles.length} 篇
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={11} />
                          {kb.saves}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-ink-faint">
                        by {getUser(kb.authorId).name}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-sage" />
                    </button>
                  ))}
                </div>
              </section>
            )
        )}
      </div>
    </div>
  );
}
