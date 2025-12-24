import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LifeEmptyStateProps {
  onClose?: () => void;
}

export const LifeEmptyState: React.FC<LifeEmptyStateProps> = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full rounded-2xl bg-white shadow-sm border border-slate-100 p-10 md:p-14 text-center flex flex-col items-center gap-6">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
        <GraduationCap size={52} className="text-indigo-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">连接你的校园生活</h2>
        <p className="text-sm text-slate-500">
          完成学生认证，解锁本校专属的生活圈、二手信息与活动。
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]"
          onClick={() => navigate('/me/certification')}
        >
          🎓 立即认证
        </button>
        {onClose && (
          <button
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            以后再说
          </button>
        )}
      </div>
    </div>
  );
};
