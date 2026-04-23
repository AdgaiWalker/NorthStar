import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[page-error]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-reader-max px-5 py-16">
          <div className="rounded-2xl border border-rose-light bg-rose-light p-6 text-rose-custom">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
              <AlertTriangle size={20} />
            </div>
            <h1 className="font-display text-[22px] font-bold">加载失败</h1>
            <p className="mt-2 text-sm leading-6">
              页面加载时遇到问题。请刷新重试，或者稍后再打开。
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
