import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-1" /> 返回首页
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <Shield size={48} className="mx-auto mb-4 text-blue-600" />
        <h1 className="text-2xl font-bold mb-2">系统后台</h1>
        <p className="text-slate-500 mb-6">
          管理后台功能计划在 V3-V4 实现。当前版本为原型演示。
        </p>
        <div className="inline-block px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">
          功能开发中...
        </div>
      </div>
    </div>
  );
};
