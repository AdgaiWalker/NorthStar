import { useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, GraduationCap, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export default function CreateMenuOverlay() {
  const certStatus = useAppStore((s) => s.certStatus);
  const setShowCreateMenu = useAppStore((s) => s.setShowCreateMenu);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setShowCreateMenu(false);
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setShowCreateMenu(false)}
    >
      <div
        className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-surface p-7 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-display text-lg font-bold text-ink">创建</span>
            <button
              onClick={() => setShowCreateMenu(false)}
              className="rounded-lg p-1 text-ink-faint transition-colors hover:bg-bg-subtle hover:text-ink-muted"
            >
              <X size={18} />
            </button>
          </div>

          <button
            onClick={() => handleNavigate('/post/create')}
            className={cn(
              'mb-3 flex w-full items-center gap-3.5 rounded-lg border border-border p-4 text-left transition-all hover:border-sage hover:bg-sage-light'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-light">
              <MessageSquare size={18} className="text-sage" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">发帖子</div>
              <div className="text-xs text-ink-muted">快问快答、短分享、求助</div>
            </div>
          </button>

          {certStatus === 'approved' ? (
            <button
              onClick={() => handleNavigate('/write')}
              className="flex w-full items-center gap-3.5 rounded-lg border border-border p-4 text-left transition-all hover:border-blue-custom hover:bg-blue-light"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-light">
                <FileText size={18} className="text-blue-custom" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">写文章</div>
                <div className="text-xs text-ink-muted">AI 对话式写作</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateMenu(false)}
              className="flex w-full items-center gap-3.5 rounded-lg border border-border p-4 text-left transition-all hover:border-amber-custom hover:bg-amber-light"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-light">
                <GraduationCap size={18} className="text-amber-custom" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">申请认证</div>
                <div className="text-xs text-ink-muted">解锁写文章权限</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
