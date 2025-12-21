import React from 'react';
import { Shield } from 'lucide-react';
import { ViewState } from '../../types';

interface AdminViewProps {
  navigate: (view: ViewState) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ navigate }) => (
  <div className="p-8 text-center animate-in fade-in">
    <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4 text-slate-400">
      <Shield size={32} />
    </div>
    <h2 className="text-2xl font-bold mb-2">管理后台</h2>
    <p className="text-slate-500">仅供演示。此处将显示内容管理系统。</p>
    <button
      onClick={() => navigate({ type: 'home' })}
      className="mt-6 text-blue-600 font-medium hover:underline"
    >
      返回前台
    </button>
  </div>
);
