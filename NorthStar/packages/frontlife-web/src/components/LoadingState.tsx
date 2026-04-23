import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';

export function LoadingState({ label = '加载中...' }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-border-light bg-surface p-6">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <LoaderCircle size={18} className="animate-spin text-sage" />
        {label}
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-4 w-3/5 rounded-full bg-bg-subtle" />
        <div className="h-4 w-4/5 rounded-full bg-bg-subtle" />
        <div className="h-4 w-2/5 rounded-full bg-bg-subtle" />
      </div>
    </div>
  );
}

export function ErrorState({
  title = '加载失败',
  message = '加载失败，请稍后重试。',
  onRetry,
  retryLabel = '重试',
  onBack,
  backLabel = '返回',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-rose-light bg-rose-light p-6 text-rose-custom">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-1 shrink-0" />
        <div className="min-w-0">
          <div className="break-words font-display text-[20px] font-bold">{title}</div>
          <p className="mt-2 break-words text-sm leading-6">{message}</p>
        </div>
      </div>
      {(onRetry || onBack) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-rose-custom px-4 py-2 text-sm font-semibold text-white"
            >
              {retryLabel}
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg border border-rose-custom/30 bg-white/70 px-4 py-2 text-sm font-semibold text-rose-custom"
            >
              {backLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title = '暂无内容',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-light bg-surface p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-bg-subtle text-ink-muted">
        <Inbox size={20} />
      </div>
      <div className="mt-3 font-display text-[18px] font-bold text-ink">{title}</div>
      {description && <p className="mx-auto mt-2 max-w-[460px] text-sm leading-6 text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
