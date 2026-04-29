import React, { useEffect, useState } from 'react';
import { AlertTriangle, Github, LoaderCircle, Lock, LogIn, Send, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { identityApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { IdentitySession, PlatformRole } from '@ns/shared';

type LoginMode = 'login' | 'register' | 'apply';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, setIdentitySession } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';
  const [mode, setMode] = useState<LoginMode>('login');
  const [account, setAccount] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [useCase, setUseCase] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    identityApi
      .getGitHubOAuthStatus()
      .then((result) => {
        if (!cancelled) setOauthConfigured(result.configured);
      })
      .catch(() => {
        if (!cancelled) setOauthConfigured(false);
      })
      .finally(() => {
        if (!cancelled) setOauthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const oauthError = query.get('oauth_error');
    if (oauthError) {
      setError(oauthError);
      return;
    }

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    const id = hash.get('id');
    const username = hash.get('username');
    const email = hash.get('email');
    const name = hash.get('name');
    const role = hash.get('role');
    const site = hash.get('site');
    const emailVerified = hash.get('emailVerified');

    if (!token || !id || !username || !email || !name || !role || !site) return;

    const session: IdentitySession = {
      token,
      user: {
        id,
        username,
        email,
        name,
        role: role as PlatformRole,
        site: site === 'com' ? 'com' : 'cn',
        emailVerified: emailVerified === '1',
      },
    };

    setIdentitySession(session);
    navigate('/', { replace: true });
  }, [navigate, setIdentitySession]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'apply') {
        await identityApi.submitApplication({
          name: username.trim() || account.trim(),
          email: email.trim(),
          useCase: useCase.trim(),
        });
        setMessage('申请已提交，审核结果会通过站内流程处理。');
        return;
      }

      const session =
        mode === 'login'
          ? await identityApi.login({ account: account.trim(), password })
          : await identityApi.register({
              username: username.trim(),
              email: email.trim() || undefined,
              password,
              inviteCode: inviteCode.trim() || undefined,
            });
      setIdentitySession(session);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const startGitHubLogin = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const result = await identityApi.startGitHubOAuth();
      window.location.href = result.authorizeUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub OAuth 启动失败，请稍后重试。');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[68vh] items-center justify-center px-4 py-10 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-sm ${
          isEyeCare ? 'border-stone-200 bg-white' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            {mode === 'login' ? <LogIn size={20} /> : mode === 'register' ? <UserPlus size={20} /> : <Send size={20} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {mode === 'login' ? '登录全球站' : mode === 'register' ? '创建全球站账号' : '提交准入申请'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">统一账号服务会按 com 站点校验身份与准入。</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'login' ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">用户名或邮箱</span>
              <input
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                autoComplete="username"
              />
            </label>
          ) : mode === 'register' ? (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">用户名</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">邮箱（可选）</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                  autoComplete="email"
                  type="email"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">邀请码（可选）</span>
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                  autoComplete="off"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">姓名或昵称</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">邮箱</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                  type="email"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">使用场景</span>
                <textarea
                  value={useCase}
                  onChange={(event) => setUseCase(event.target.value)}
                  className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </label>
            </>
          )}

          {mode !== 'apply' && <label className="block">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              type="password"
            />
          </label>}

          {error && (
            <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-600">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">
              <Send size={16} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400"
          >
            {submitting && <LoaderCircle size={16} className="animate-spin" />}
            {mode === 'login' ? '登录' : mode === 'register' ? '注册并登录' : '提交申请'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <button
            type="button"
            disabled={!oauthConfigured || oauthLoading || submitting}
            onClick={() => void startGitHubLogin()}
            className="flex w-full items-center justify-between gap-3 text-left text-sm text-slate-500 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <Github size={16} />
              GitHub OAuth
            </span>
            <span className="flex items-center gap-1 text-xs">
              {oauthLoading ? <LoaderCircle size={13} className="animate-spin" /> : <Lock size={13} />}
              {oauthLoading ? '检查中' : oauthConfigured ? '使用 GitHub 登录' : '尚未配置'}
            </span>
          </button>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {oauthConfigured
              ? 'GitHub 账号需使用已审核邮箱，或绑定到已有全球站账号。'
              : '当前可先使用用户名和密码。GitHub 准入会在服务端 OAuth 配置完成后开放。'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
            setMessage('');
          }}
          className="mt-5 w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          {mode === 'login' ? '没有账号？创建账号' : '已有账号？返回登录'}
        </button>
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => navigate('/reset-password')}
            className="mt-2 w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            忘记密码？
          </button>
        )}
        {mode !== 'apply' && (
          <button
            type="button"
            onClick={() => {
              setMode('apply');
              setError('');
              setMessage('');
            }}
            className="mt-3 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            没有邀请码？提交准入申请
          </button>
        )}
      </div>
    </div>
  );
};
