import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { LegalDocumentRecord } from '@ns/shared';
import { CheckCircle, FileText, Lock, Mail, User } from 'lucide-react';
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
  const setIdentityUser = useUserStore((state) => state.setIdentityUser);
  const setPermissions = useUserStore((state) => state.setPermissions);
  const clearSessionExpired = useUIStore((state) => state.clearSessionExpired);
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('zhang');
  const [email, setEmail] = useState('zhang@example.com');
  const [password, setPassword] = useState('password');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocumentRecord[]>([]);
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalError, setLegalError] = useState('');
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

  useEffect(() => {
    if (mode !== 'register' || legalDocuments.length > 0) return;

    let active = true;
    setLegalLoading(true);
    setLegalError('');

    api
      .listLegalDocuments()
      .then((result) => {
        if (active) setLegalDocuments(result.items);
      })
      .catch((err) => {
        if (active) setLegalError(err instanceof Error ? err.message : '协议加载失败，请稍后重试。');
      })
      .finally(() => {
        if (active) setLegalLoading(false);
      });

    return () => {
      active = false;
    };
  }, [legalDocuments.length, mode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const latestConsentVersion = getLatestConsentVersion(legalDocuments);
    if (mode === 'register' && !consentAccepted) {
      setError('请先阅读并同意用户协议和隐私政策。');
      return;
    }

    if (mode === 'register' && !latestConsentVersion) {
      setError('协议版本暂时不可用，请稍后重试。');
      return;
    }

    setSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await api.login({ account: username, password })
          : await api.register({
              username,
              email,
              password,
              consentVersion: latestConsentVersion ?? undefined,
            });

      setToken(result.token);
      const identity = await api.getIdentityMe();
      setIdentityUser(identity.user);
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
      <form onSubmit={submit} className="w-full rounded-lg border border-border-light bg-surface p-6 shadow-md">
        <div className="mb-6">
          <div className="mb-2 font-display text-[26px] font-bold text-ink">
            {mode === 'login' ? '登录盘根' : '注册盘根'}
          </div>
          <p className="text-sm leading-6 text-ink-muted">注册使用用户名、邮箱和密码；登录可使用用户名或邮箱。</p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
            {mode === 'login' ? '用户名或邮箱' : '用户名'}
          </span>
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

        {mode === 'register' && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-secondary">邮箱</span>
            <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 focus-within:border-sage">
              <Mail size={16} className="text-ink-muted" />
              <input
                id="frontlife-email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-full flex-1 bg-transparent text-sm outline-none"
                autoComplete="email"
              />
            </div>
          </label>
        )}

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

        {mode === 'register' && (
          <div className="mb-4 rounded-lg border border-border bg-bg-subtle px-3 py-3">
            <label className="flex items-start gap-3 text-sm leading-6 text-ink-secondary">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(event) => setConsentAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-sage focus:ring-sage"
              />
              <span>
                我已阅读并同意
                <Link to="/legal/terms" className="mx-1 font-semibold text-sage hover:text-sage-dark">
                  用户协议
                </Link>
                和
                <Link to="/legal/privacy" className="mx-1 font-semibold text-sage hover:text-sage-dark">
                  隐私政策
                </Link>
                。
              </span>
            </label>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
              {legalLoading ? (
                <>
                  <FileText size={14} />
                  正在读取协议版本...
                </>
              ) : legalError ? (
                <span className="text-rose-custom">{legalError}</span>
              ) : (
                <>
                  <CheckCircle size={14} className="text-sage" />
                  当前协议版本：
                  {getLatestConsentVersion(legalDocuments) ?? '待加载'}
                </>
              )}
            </div>
          </div>
        )}

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

function getLatestConsentVersion(documents: LegalDocumentRecord[]) {
  const terms = documents.find((item) => item.type === 'terms');
  const privacy = documents.find((item) => item.type === 'privacy');
  return terms?.version ?? privacy?.version ?? null;
}
