import React, { useMemo, useState } from 'react';
import { Trash2, Share2, Sparkles, X, Copy, Check, MessageCircle, MessageSquare } from 'lucide-react';
import { MOCK_TOOLS } from '../constants';
import { SITE_URL } from '@/constants/ui';
import { useShare } from '@/hooks/useShare';

interface FloatingDockProps {
  selectedToolIds: Set<string>;
  onClearSelection: () => void;
  onGenerate: (toolIds: string[]) => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  selectedToolIds,
  onClearSelection,
  onGenerate,
}) => {
  const { copied, copyText } = useShare();
  const [showShareMenu, setShowShareMenu] = useState(false);

  const toolIds = useMemo(() => Array.from(selectedToolIds), [selectedToolIds]);

  const handleShareTextCopy = () => {
    const selectedTools = MOCK_TOOLS.filter(t => selectedToolIds.has(t.id));
    const text = `我在盘根 AI 指南针发现了这些好用的工具：\n${selectedTools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n')}\n快来看看：${SITE_URL}`;

    copyText(text);
  };

  if (toolIds.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 w-auto max-w-[95vw]">
      <div className="flex items-center p-2 rounded-full bg-[#1A1A1A]/95 backdrop-blur-2xl text-white shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/10 ring-1 ring-white/5 gap-4">
        {/* Left: Tools Preview & Count */}
        <div className="flex items-center pl-2 gap-3">
          <div className="flex -space-x-3">
            {toolIds.slice(0, 4).map(id => {
              const tool = MOCK_TOOLS.find(t => t.id === id);
              if (!tool) return null;
              return (
                <img
                  key={id}
                  src={tool.imageUrl}
                  className="w-9 h-9 rounded-full border-2 border-[#1A1A1A] object-cover ring-1 ring-white/10"
                  alt={tool.name}
                />
              );
            })}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 font-medium leading-none mb-0.5 tracking-wide">已选</span>
            <span className="text-sm text-white font-bold leading-none whitespace-nowrap">
              {toolIds.length}{' '}
              <span className="text-xs font-normal text-white/50">个工具</span>
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-8 bg-white/10"></div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 pr-1">
          {/* Clear Button */}
          <button
            onClick={onClearSelection}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
            title="清空选择"
          >
            <Trash2 size={16} />
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(prev => !prev)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${
                showShareMenu ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'
              }`}
              title="分享"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={18} />}
            </button>

            {showShareMenu && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[60] animate-in slide-in-from-bottom-2 fade-in">
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-200"></div>
                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-50 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">分享清单</span>
                  <button
                    onClick={() => setShowShareMenu(false)}
                    className="text-slate-400 hover:text-slate-600"
                    title="关闭"
                  >
                    <X size={14} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleShareTextCopy();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Copy size={16} className="text-slate-400" /> 复制文本
                </button>

                <button
                  onClick={() => {
                    copyText(`盘根AI工具分享：${SITE_URL}/share/${Date.now()}`).then(() =>
                      alert('链接已复制，请打开微信粘贴')
                    );
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <MessageCircle size={16} className="text-green-500" /> 分享到微信
                </button>

                <button
                  onClick={() => {
                    copyText(`盘根AI工具分享：${SITE_URL}/share/${Date.now()}`).then(() =>
                      alert('链接已复制，请打开QQ粘贴')
                    );
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <MessageSquare size={16} className="text-blue-500" /> 分享到 QQ
                </button>
              </div>
            )}
          </div>

          {/* Generate Button (Primary) */}
          <button
            onClick={() => onGenerate(toolIds)}
            className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles size={16} fill="currentColor" className="text-blue-200" />
            生成方案
          </button>
        </div>
      </div>
    </div>
  );
};
