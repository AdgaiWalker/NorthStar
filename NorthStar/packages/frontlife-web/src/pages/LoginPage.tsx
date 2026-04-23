import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { api } from '@/services/api';
import { consumeSessionReason, SESSION_EXPIRED_MESSAGE, SESSION_EXPIRED_REASON } from '@/services/authSession';
import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);
  const setPermissions = useUserStore((state) => state.setPermissions);
  const clearSessionExpired = useUIStore((state) => state.clearSessionExpired);
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('zhang');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const persistedReason = consumeSessionReason();
    const reason = searchParams.get('reason') || persistedReason;
    if (reason === SESSION_EXPIRED_REASON) {
      setError(SESSION_EXPIRED_MESSAGE);
      clearSessionExpired();
    }
  }, [clearSessionExpired, searchParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await api.login({ username, password })
          : await api.register({ username, password });

      setToken(result.token);
      setUser(result.user.id, result.user.name);
      const permissions = await api.getPermissions();
      setPermissions(permissions);
      clearSessionExpired();
      navigate('/me');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--nav-h))] max-w-[440px] items-center px-5 py-10">
      <form onSubmit={submit} className="w-full rounded-2xl border border-border-light bg-surface p-6 shadow-md">
        <div className="mb-6">
          <div className="mb-2 font-display text-[26px] font-bold text-ink">
            {mode === 'login' ? '登录盘根' : '注册盘根'}
          </div>
          <p className="text-sm leading-6 text-ink-muted">
            当前使用用户名和密码登录。内测账号请按发放信息登录。
          </p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">用户名</span>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 focus-within:border-sage">
            <User size={16} className="text-ink-muted" />
            <input
              id="frontlife-username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-full flex-1 bg-transparent text-sm outline-none"
              autoComplete="username"
            />
          </div>
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">密码</span>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 focus-within:border-sage">
            <Lock size={16} className="text-ink-muted" />
            <input
              id="frontlife-password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="h-full flex-1 bg-transparent text-sm outline-none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
        </label>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-light bg-rose-light px-3 py-2 text-sm text-rose-custom">
            {error}
          </div>
        )}

        <button
          disabled={submitting}
          className={cn(
            'h-11 w-full rounded-lg text-sm font-semibold text-white transition-colors',
            submitting ? 'bg-ink-faint' : 'bg-sage hover:bg-sage-dark',
          )}
        >
          {submitting ? '提交中...' : mode === 'login' ? '登录' : '注册'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 w-full text-center text-sm text-ink-muted transition-colors hover:text-sage"
        >
          {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
        </button>
      </form>
    </div>
  );
}
