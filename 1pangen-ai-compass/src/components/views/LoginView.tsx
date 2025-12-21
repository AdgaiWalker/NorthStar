import React from 'react';
import { ThemeMode } from '../../types';

interface LoginViewProps {
  themeMode: ThemeMode;
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ themeMode, onLogin }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in">
    <div
      className={`p-8 rounded-3xl w-full max-w-md text-center ${
        themeMode === 'eye-care' ? 'bg-white shadow-sm border border-stone-200' : 'bg-white shadow-xl'
      }`}
    >
      <h2 className="text-2xl font-bold mb-2">欢迎回来</h2>
      <p className="text-slate-500 mb-8">登录以保存您的 AI 方案和收藏。</p>
      <button
        onClick={onLogin}
        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
      >
        模拟一键登录
      </button>
    </div>
  </div>
);
