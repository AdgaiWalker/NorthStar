import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckSquare,
  Copy,
  Download,
  Layout,
  MessageCircle,
  MessageSquare,
  Share2,
  Sparkles,
  Trash2,
  X,
  Zap,
  Settings,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ContentType, ThemeMode, UserSolution, ViewState } from '../../types';
import { MOCK_TOOLS } from '../../constants';

export type UserCenterTab = 'profile' | 'history' | 'favorites' | 'creator' | 'solutions' | 'stats' | 'settings';

const LANGUAGE_OPTIONS: Array<{ id: 'zh' | 'en' | 'jp' | 'ru'; label: string }> = [
  { id: 'zh', label: '简体中文' },
  { id: 'en', label: 'English' },
  { id: 'jp', label: '日本語' },
  { id: 'ru', label: 'Русский' },
];

const EXPORT_FORMAT_OPTIONS: Array<{ id: 'md' | 'txt' | 'csv'; label: string }> = [
  { id: 'md', label: 'Markdown (.md)' },
  { id: 'txt', label: '纯文本 (.txt)' },
  { id: 'csv', label: '表格数据 (.csv)' },
];

interface UserCenterViewProps {
  tab?: UserCenterTab;
  themeMode: ThemeMode;
  userSolutions: UserSolution[];
  navigate: (view: ViewState) => void;
  setContentType: (t: ContentType) => void;
  onExportSolution: (sol: UserSolution, format: 'md' | 'txt' | 'csv') => void;
  onDeleteSolution: (id: string) => void;
}

export const UserCenterView: React.FC<UserCenterViewProps> = ({
  tab = 'profile',
  themeMode,
  userSolutions,
  navigate,
  setContentType,
  onExportSolution,
  onDeleteSolution,
}) => {
  // Local state for UserCenter
  const [viewSolution, setViewSolution] = useState<UserSolution | null>(null);
  const [solutionToDelete, setSolutionToDelete] = useState<string | null>(null);

  // Share state
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Settings state (Local prototype state)
  const [settingsTheme, setSettingsTheme] = useState<ThemeMode>(themeMode);
  const [settingsLang, setSettingsLang] = useState<'zh' | 'en' | 'jp' | 'ru'>('zh');
  const [settingsExport, setSettingsExport] = useState<'md' | 'txt' | 'csv'>('md');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    // Sync local theme state if prop changes
    setSettingsTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    // Reset state when viewSolution changes or closes
    setShowShareMenu(false);
    setLinkCopied(false);
    setShowExportMenu(false);
  }, [viewSolution]);

  const handleDeleteConfirm = () => {
    if (!solutionToDelete) return;

    onDeleteSolution(solutionToDelete);

    // If we are currently viewing the deleted solution, close the drawer
    if (viewSolution?.id === solutionToDelete) {
      setViewSolution(null);
    }

    setSolutionToDelete(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div
            className={`p-4 rounded-2xl ${
              themeMode === 'eye-care'
                ? 'bg-[#FDFCF8] border border-stone-100'
                : 'bg-white shadow-sm border border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                <img src="https://picsum.photos/100/100?random=user" alt="User" />
              </div>
              <div>
                <div className="font-bold text-sm">My User</div>
                <div className="text-xs text-slate-400">Pro Member</div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => navigate({ type: 'user-center', tab: 'profile' })}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'profile' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                个人资料
              </button>
              <button
                onClick={() => navigate({ type: 'user-center', tab: 'solutions' })}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'solutions' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                我的方案
              </button>
              <button
                onClick={() => navigate({ type: 'user-center', tab: 'favorites' })}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'favorites' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                收藏夹
              </button>
              <button
                onClick={() => navigate({ type: 'user-center', tab: 'settings' })}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                设置
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'solutions' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">我的 AI 方案</h2>
              {userSolutions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                  <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                  <p>还没有生成过方案</p>
                  <button
                    onClick={() => {
                      navigate({ type: 'home' });
                      setContentType(ContentType.TOOL);
                    }}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    去创建
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSolutions.map(sol => (
                    <div
                      key={sol.id}
                      onClick={() => setViewSolution(sol)}
                      className={`p-6 rounded-2xl cursor-pointer hover:border-blue-400 transition-all ${
                        themeMode === 'eye-care'
                          ? 'bg-white border border-stone-200'
                          : 'bg-white border border-slate-100 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{sol.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onExportSolution(sol, 'md');
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="快捷导出 Markdown"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSolutionToDelete(sol.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{sol.targetGoal}</p>
                      <div className="flex items-center gap-2">
                        {sol.toolIds.map(tid => {
                          const t = MOCK_TOOLS.find(mt => mt.id === tid);
                          if (!t) return null;
                          return (
                            <img
                              key={tid}
                              src={t.imageUrl}
                              className="w-6 h-6 rounded-full border border-white shadow-sm"
                              title={t.name}
                              alt={t.name}
                            />
                          );
                        })}
                        <span className="text-xs text-slate-400 ml-2">{sol.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className={`p-8 rounded-2xl ${themeMode === 'eye-care' ? 'bg-white' : 'bg-white shadow-sm'}`}>
              <h2 className="text-xl font-bold mb-4">个人资料</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/100/100?random=user" className="w-full h-full object-cover" alt="User" />
                </div>
                <div>
                  <div className="font-bold text-lg">My User</div>
                  <div className="text-slate-500">user@pangen.ai</div>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">昵称</label>
                  <input type="text" defaultValue="My User" className="w-full p-2 bg-slate-50 rounded-lg border-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">邮箱</label>
                  <input
                    type="text"
                    defaultValue="user@pangen.ai"
                    disabled
                    className="w-full p-2 bg-slate-50 rounded-lg border-none opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className={`p-8 rounded-2xl ${themeMode === 'eye-care' ? 'bg-white' : 'bg-white shadow-sm'}`}>
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Settings size={24} /> 设置
              </h2>

              <div className="space-y-8 max-w-2xl">
                {/* Appearance */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900">外观设置</h3>
                    <p className="text-xs text-slate-500 mt-1">选择最适合您的界面风格</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSettingsTheme('light')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        settingsTheme === 'light'
                          ? 'border-blue-600 bg-white text-blue-600 shadow-sm'
                          : 'border-transparent bg-white text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      🌞 明亮模式
                    </button>
                    <button
                      onClick={() => setSettingsTheme('eye-care')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        settingsTheme === 'eye-care'
                          ? 'border-stone-400 bg-[#FDFCF8] text-stone-600 shadow-sm'
                          : 'border-transparent bg-white text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      🌿 护眼模式
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900">语言偏好</h3>
                    <p className="text-xs text-slate-500 mt-1">界面显示语言</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setSettingsLang(lang.id)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          settingsLang === lang.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Preferences */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900">默认导出格式</h3>
                    <p className="text-xs text-slate-500 mt-1">方案导出时的默认文件类型</p>
                  </div>
                  <div className="flex gap-2">
                    {EXPORT_FORMAT_OPTIONS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setSettingsExport(fmt.id)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          settingsExport === fmt.id
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setShowSaveSuccess(true);
                      setTimeout(() => setShowSaveSuccess(false), 2000);
                    }}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    保存更改
                  </button>
                  {showSaveSuccess && (
                    <span className="text-green-600 text-sm font-bold animate-in fade-in slide-in-from-left-2 flex items-center gap-1">
                      <CheckSquare size={16} /> 设置已更新
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Placeholders for other tabs */}
          {(tab === 'favorites' || tab === 'history' || tab === 'creator' || tab === 'stats') && (
            <div className="text-center py-12 text-slate-400">功能开发中...</div>
          )}
        </div>
      </div>

      {/* Side Drawer for Solution Details */}
      {viewSolution && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setViewSolution(null)}
          ></div>
          <div
            className={`relative w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col ${
              themeMode === 'eye-care' ? 'bg-[#FDFCF8]' : 'bg-white'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start z-10">
              <div>
                <h2 className="text-2xl font-bold mb-1">{viewSolution.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {viewSolution.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-blue-500" /> AI 生成方案
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Share Button with Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className={`p-2 rounded-full transition-colors ${
                      showShareMenu ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                    }`}
                    title="分享方案"
                  >
                    <Share2 size={24} />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                      <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">分享方案</div>
                      <button
                        onClick={() => {
                          // Mock copy link
                          navigator.clipboard.writeText(`https://pangen-ai.com/s/${viewSolution.id}`);
                          setLinkCopied(true);
                          setTimeout(() => {
                            setLinkCopied(false);
                            setShowShareMenu(false);
                          }, 1000);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 transform origin-left ${
                          linkCopied ? 'bg-green-50 text-green-700 font-bold scale-[1.02]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {linkCopied ? (
                          <CheckSquare size={16} className="text-green-500 animate-in zoom-in spin-in-90" />
                        ) : (
                          <Copy size={16} />
                        )}
                        {linkCopied ? '已复制链接' : '复制链接'}
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button
                        onClick={() =>
                          navigator.clipboard
                            .writeText(`https://pangen-ai.com/s/${viewSolution.id} (Share to WeChat)`)
                            .then(() => alert('已复制链接，请打开微信粘贴分享'))
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-5 h-5 bg-green-500 text-white rounded-md flex items-center justify-center">
                          <MessageCircle size={12} fill="currentColor" />
                        </div>
                        分享到微信
                      </button>
                      <button
                        onClick={() =>
                          navigator.clipboard
                            .writeText(`https://pangen-ai.com/s/${viewSolution.id} (Share to QQ)`)
                            .then(() => alert('已复制链接，请打开QQ粘贴分享'))
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-5 h-5 bg-blue-500 text-white rounded-md flex items-center justify-center">
                          <MessageSquare size={12} fill="currentColor" />
                        </div>
                        分享到 QQ
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button
                        onClick={() =>
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                              `Check out this AI solution: ${viewSolution.title}`
                            )}&url=${encodeURIComponent(`https://pangen-ai.com/s/${viewSolution.id}`)}`,
                            '_blank'
                          )
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-5 h-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">
                          X
                        </div>
                        分享到 X (Twitter)
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
                              `https://pangen-ai.com/s/${viewSolution.id}`
                            )}&title=${encodeURIComponent(`【盘根AI】${viewSolution.title}`)}`,
                            '_blank'
                          )
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-5 h-5 bg-red-500 text-white rounded-md flex items-center justify-center text-[10px] font-bold">
                          wb
                        </div>
                        分享到微博
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setViewSolution(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  title="关闭"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1">
                  <Layout size={12} /> 核心目标
                </h3>
                <p className="text-slate-700 font-medium">{viewSolution.targetGoal}</p>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap size={16} /> 涉及工具
                </h3>
                <div className="flex flex-wrap gap-3">
                  {viewSolution.toolIds.map(tid => {
                    const tool = MOCK_TOOLS.find(t => t.id === tid);
                    return tool ? (
                      <div
                        key={tid}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all bg-white cursor-pointer"
                        onClick={() => navigate({ type: 'tool-detail', toolId: tid })}
                      >
                        <img src={tool.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" alt="" />
                        <div>
                          <div className="font-bold text-sm">{tool.name}</div>
                          <div className="text-xs text-slate-500">{tool.domain}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen size={16} /> 方案建议
                </h3>
                <div className={`prose max-w-none ${themeMode === 'eye-care' ? 'prose-stone' : 'prose-slate'}`}>
                  <ReactMarkdown>{viewSolution.aiAdvice}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center relative">
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-all shadow-sm flex items-center gap-2"
                >
                  <Download size={16} /> 导出方案
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 origin-bottom-left z-50">
                    <button
                      onClick={() => {
                        onExportSolution(viewSolution, 'md');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => {
                        onExportSolution(viewSolution, 'txt');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      TXT 文本
                    </button>
                    <button
                      onClick={() => {
                        onExportSolution(viewSolution, 'csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      CSV 表格
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSolutionToDelete(viewSolution.id)}
                className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> 删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {solutionToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSolutionToDelete(null)}
          ></div>
          <div
            className={`relative w-full max-w-sm p-6 rounded-2xl shadow-2xl scale-100 transition-all ${
              themeMode === 'eye-care' ? 'bg-[#FDFCF8]' : 'bg-white'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-900">确认删除方案？</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">此操作无法撤销。该方案及其所有 AI 分析建议将被永久移除。</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setSolutionToDelete(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
