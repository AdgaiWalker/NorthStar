import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSearchStore } from '@/store/useSearchStore';
import { cn } from '@/lib/utils';

export default function SearchOverlay() {
  const navigate = useNavigate();
  const showSearch = useUIStore((state) => state.showSearch);
  const setShowSearch = useUIStore((state) => state.setShowSearch);
  const recentQueries = useSearchStore((state) => state.recentQueries);
  const addRecentQuery = useSearchStore((state) => state.addRecentQuery);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSearch, setShowSearch]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    addRecentQuery(value);
    setShowSearch(false);
    setQuery('');
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleRecentClick = (recentQuery: string) => {
    addRecentQuery(recentQuery);
    setShowSearch(false);
    navigate(`/search?q=${encodeURIComponent(recentQuery)}`);
  };

  if (!showSearch) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh] backdrop-blur-sm"
      onClick={() => setShowSearch(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[560px] px-4"
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-border-light px-4 py-3">
            <Search size={20} className="text-ink-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索校园内容..."
              className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setQuery('');
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-bg-subtle hover:text-ink"
              aria-label="关闭搜索"
            >
              <X size={18} />
            </button>
          </form>

          {!query && recentQueries.length > 0 && (
            <div className="max-h-[320px] overflow-y-auto px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-ink-faint">最近搜索</p>
              <div className="space-y-1">
                {recentQueries.slice(0, 8).map((recentQuery) => (
                  <button
                    key={recentQuery}
                    onClick={() => handleRecentClick(recentQuery)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-sage-light hover:text-sage"
                  >
                    <Search size={14} className="text-ink-faint" />
                    <span className="flex-1 truncate">{recentQuery}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && (
            <div className="max-h-[320px] overflow-y-auto px-4 py-3">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-sage-light hover:text-sage"
              >
                <Search size={14} className="text-ink-muted" />
                <span className="flex-1 truncate">
                  搜索 <span className="font-semibold text-sage">"{query}"</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
