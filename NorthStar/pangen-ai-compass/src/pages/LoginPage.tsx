import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, setIsLoggedIn } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in">
      <div
        className={`p-8 rounded-3xl w-full max-w-md text-center ${
          isEyeCare
            ? 'bg-white shadow-sm border border-stone-200'
            : 'bg-white shadow-xl'
        }`}
      >
        <h2 className="text-2xl font-bold mb-2">欢迎回来</h2>
        <p className="text-slate-500 mb-8">登录以保存您的 AI 方案和收藏。</p>
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          模拟一键登录
        </button>
      </div>
    </div>
  );
};
