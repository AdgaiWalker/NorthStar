import { Link } from 'react-router-dom';
import { Scale, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-border-light px-4 py-6 text-center text-xs text-ink-muted">
      <div className="mx-auto flex max-w-content-max flex-col items-center gap-3 sm:flex-row sm:justify-between sm:px-5">
        <span>&copy; {new Date().getFullYear()} 盘根校园</span>
        <div className="flex gap-4">
          <Link to="/legal/terms" className="inline-flex items-center gap-1 transition-colors hover:text-ink-secondary">
            <Scale size={12} />
            用户协议
          </Link>
          <Link to="/legal/privacy" className="inline-flex items-center gap-1 transition-colors hover:text-ink-secondary">
            <Shield size={12} />
            隐私政策
          </Link>
        </div>
      </div>
    </footer>
  );
}
