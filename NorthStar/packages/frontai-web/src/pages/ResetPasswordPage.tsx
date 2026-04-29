import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle, LoaderCircle, Mail, Lock, KeyRound } from 'lucide-react';
import { complianceApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

type Step = 'request' | 'confirm' | 'success';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { themeMode } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';

  const [step, setStep] = useState<Step>('request');
  const [account, setAccount] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 检查 URL 中是否有 token，如果有则直接进入确认步骤
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setStep('confirm');
    }
  }, [searchParams]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!account.trim()) {
      setError('请输入用户名或邮箱');
      return;
    }

    setLoading(true);
    try {
      await complianceApi.requestPasswordReset(account.trim());
      setSuccess('重置邮件已发送，请查收邮箱中的重置链接。');
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError('请输入重置令牌');
      return;
    }

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await complianceApi.confirmPasswordReset(token.trim(), newPassword);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[68vh] items-center justify-center px-4 py-10 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-sm ${
          isEyeCare ? 'border-stone-200 bg-white' : 'border-slate-200 bg-white'
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} /> 返回
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              {step === 'request' ? <Mail size={20} /> : step === 'confirm' ? <KeyRound size={20} /> : <CheckCircle size={20} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {step === 'request' ? '重置密码' : step === 'confirm' ? '确认重置' : '重置成功'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {step === 'request'
                  ? '输入您的用户名或邮箱，我们将发送重置链接'
                  : step === 'confirm'
                  ? '输入重置令牌和新密码'
                  : '密码已成功重置'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-600">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && step === 'confirm' && (
          <div className="mb-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">用户名或邮箱</span>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                placeholder="请输入用户名或邮箱"
                autoComplete="username"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              发送重置邮件
            </button>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            {!searchParams.get('token') && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">重置令牌</span>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                  placeholder="请输入邮件中的重置令牌"
                  autoComplete="one-time-code"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">新密码</span>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                type="password"
                placeholder="至少 6 位"
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">确认新密码</span>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900"
                type="password"
                placeholder="再次输入新密码"
                autoComplete="new-password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              确认重置密码
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <p className="text-slate-600 mb-6">您的密码已成功重置，现在可以使用新密码登录。</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              前往登录
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            返回登录
          </button>
        </div>
      </div>
    </div>
  );
};
