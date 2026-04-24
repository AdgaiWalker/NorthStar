import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

interface DataStateProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  onRetry: () => void;
  children: ReactNode;
}

export function DataState({ loading, error, empty, emptyText, onRetry, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="state-block">
        <Loader2 className="h-5 w-5 animate-spin text-teal" aria-hidden="true" />
        <span>正在加载数据</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-block border-rust/40 bg-rust/5 text-rust">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <span>{error}</span>
        <button className="inline-action" type="button" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          重试
        </button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="state-block">
        <Inbox className="h-5 w-5 text-teal" aria-hidden="true" />
        <span>{emptyText}</span>
      </div>
    );
  }

  return <>{children}</>;
}
