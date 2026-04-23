import { LoaderCircle } from 'lucide-react';

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

export function ErrorState({ message = '加载失败' }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-rose-light bg-rose-light p-6 text-rose-custom">
      <div className="font-display text-[20px] font-bold">加载失败</div>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}
