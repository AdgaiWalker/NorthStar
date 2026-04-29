import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  Copy,
  Download,
  GraduationCap,
  Github,
  Heart,
  Layout,
  Lock,
  Moon,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  X,
  Zap,
  Settings,
  CreditCard,
  Languages,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { PaymentOrderRecord, QuotaLedgerRecord, QuotaRecord, SolutionRecord } from '@ns/shared';
import type { UserSolution, ExportFormat, Language, Tool, Article } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { t } from '../i18n';
import { billingApi, compassApi, identityApi } from '@/services/api';

type UserCenterTab = 'profile' | 'solutions' | 'favorites' | 'settings' | 'credits' | 'certification';

// 认证学校白名单
const SCHOOLS = [
  { id: 'heihe', name: '黑河学院' },
];

export const UserCenterPage: React.FC = () => {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    favoriteToolIds,
    setFavoriteToolIds,
    toggleToolSelection,
    defaultExportFormat,
    setDefaultExportFormat,
    isLoggedIn,
    currentUser,
    studentCertification,
    submitStudentCertification,
    resetStudentCertification,
  } = useAppStore();

  const tab = (tabParam as UserCenterTab) || 'profile';
  const isEyeCare = themeMode === 'eye-care';
  const [solutionState, setSolutionState] = useState<{
    key: string;
    solutions: UserSolution[];
    tools: Tool[];
    articles: Article[];
    error: string;
  }>({
    key: '',
    solutions: [],
    tools: [],
    articles: [],
    error: '',
  });
  const [billingState, setBillingState] = useState<{
    key: string;
    quota: QuotaRecord | null;
    ledger: QuotaLedgerRecord[];
    orders: PaymentOrderRecord[];
    error: string;
    creating: boolean;
  }>({
    key: '',
    quota: null,
    ledger: [],
    orders: [],
    error: '',
    creating: false,
  });

  // 方案详情抽屉
  const [viewSolution, setViewSolution] = useState<UserSolution | null>(null);
  const [solutionToDelete, setSolutionToDelete] = useState<string | null>(null);

  // 分享/导出状态
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [githubOAuthConfigured, setGithubOAuthConfigured] = useState(false);
  const [githubOAuthLoading, setGithubOAuthLoading] = useState(true);
  const [githubOAuthError, setGithubOAuthError] = useState('');
  const [favoriteArticleIds, setFavoriteArticleIds] = useState<Set<string>>(new Set());

  const resetMenus = () => {
    setShowShareMenu(false);
    setLinkCopied(false);
    setShowExportMenu(false);
  };

  const openSolution = (sol: UserSolution) => {
    resetMenus();
    setViewSolution(sol);
  };

  const closeSolution = () => {
    resetMenus();
    setViewSolution(null);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    Promise.all([compassApi.listSolutions(), compassApi.listTools(), compassApi.listFavorites(), compassApi.listArticles()])
      .then(([solutionResult, toolResult, favoriteResult, articleResult]) => {
        if (cancelled) return;
        setFavoriteToolIds(favoriteResult.items.filter((item) => item.targetType === 'tool').map((item) => item.targetId));
        setFavoriteArticleIds(new Set(favoriteResult.items.filter((item) => item.targetType === 'article').map((item) => item.targetId)));
        setSolutionState({
          key: 'loaded',
          solutions: solutionResult.items.map(toUserSolution),
          tools: toolResult.items,
          articles: articleResult.items,
          error: '',
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setSolutionState({
          key: 'loaded',
          solutions: [],
          tools: [],
          articles: [],
          error: error instanceof Error ? error.message : '方案资产加载失败，请稍后重试。',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, setFavoriteToolIds]);

  useEffect(() => {
    if (!isLoggedIn || tab !== 'credits') return;
    let cancelled = false;

    Promise.all([billingApi.getQuota(), billingApi.listOrders()])
      .then(([quotaResult, orderResult]) => {
        if (cancelled) return;
        setBillingState({
          key: 'loaded',
          quota: quotaResult.quota,
          ledger: quotaResult.ledger,
          orders: orderResult.items,
          error: '',
          creating: false,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setBillingState({
          key: 'loaded',
          quota: null,
          ledger: [],
          orders: [],
          error: error instanceof Error ? error.message : '额度信息加载失败，请稍后重试。',
          creating: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, tab]);

  useEffect(() => {
    let cancelled = false;

    identityApi
      .getGitHubOAuthStatus()
      .then((result) => {
        if (!cancelled) setGithubOAuthConfigured(result.configured);
      })
      .catch(() => {
        if (!cancelled) setGithubOAuthConfigured(false);
      })
      .finally(() => {
        if (!cancelled) setGithubOAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createQuotaOrder = async () => {
    setBillingState((current) => ({ ...current, creating: true, error: '' }));
    try {
      const order = await billingApi.createManualOrder({ credits: 20, amountCents: 9900, currency: 'CNY' });
      setBillingState((current) => ({
        ...current,
        orders: [order, ...current.orders],
        creating: false,
      }));
    } catch (error) {
      setBillingState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '订单创建失败，请稍后重试。',
        creating: false,
      }));
    }
  };

  const startGitHubBind = async () => {
    setGithubOAuthError('');
    setGithubOAuthLoading(true);
    try {
      const result = await identityApi.startGitHubOAuth();
      window.location.href = result.authorizeUrl;
    } catch (error) {
      setGithubOAuthError(error instanceof Error ? error.message : 'GitHub OAuth 启动失败，请稍后重试。');
      setGithubOAuthLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!solutionToDelete) return;
    try {
      await compassApi.deleteSolution(solutionToDelete);
      setSolutionState((current) => ({
        ...current,
        solutions: current.solutions.filter((solution) => solution.id !== solutionToDelete),
      }));
      if (viewSolution?.id === solutionToDelete) {
        closeSolution();
      }
    } catch (error) {
      setSolutionState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '方案删除失败，请稍后重试。',
      }));
    } finally {
      setSolutionToDelete(null);
    }
  };

  const handleExportSolution = async (sol: UserSolution, format: 'md' | 'txt' | 'csv') => {
    try {
      const content = await compassApi.exportSolution(sol.id, format);
      downloadTextFile(`${sol.title}.${format}`, content);
    } catch (error) {
      setSolutionState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '方案导出失败，请稍后重试。',
      }));
    }
  };

  const handleRemoveFavorite = async (toolId: string) => {
    try {
      await compassApi.removeFavorite({ targetType: 'tool', targetId: toolId });
      setFavoriteToolIds(Array.from(favoriteToolIds).filter((id) => id !== toolId));
    } catch (error) {
      setSolutionState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '取消收藏失败，请稍后重试。',
      }));
    }
  };

  const handleRemoveArticleFavorite = async (articleId: string) => {
    try {
      await compassApi.removeFavorite({ targetType: 'article', targetId: articleId });
      setFavoriteArticleIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    } catch (error) {
      setSolutionState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '取消收藏失败，请稍后重试。',
      }));
    }
  };

  const navigateTab = (t: UserCenterTab) => {
    navigate(t === 'profile' ? '/me' : `/me/${t}`);
  };
  const solutions = solutionState.solutions;
  const tools = solutionState.tools;
  const articles = solutionState.articles;
  const solutionLoading = isLoggedIn && solutionState.key !== 'loaded';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div
            className={`p-4 rounded-2xl ${
              isEyeCare
                ? 'bg-[#FDFCF8] border border-stone-100'
                : 'bg-white shadow-sm border border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                <img src="https://picsum.photos/100/100?random=user" alt={currentUser?.name || '用户'} />
              </div>
              <div>
                <div className="font-bold text-sm">{currentUser?.name || '未登录'}</div>
                <div className="text-xs text-slate-400">{currentUser?.isPro ? 'Pro 用户' : '普通用户'}</div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => navigateTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'profile'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t('me.profile', language)}
              </button>
              <button
                onClick={() => navigateTab('solutions')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'solutions'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t('me.solutions', language)}
              </button>
              <button
                onClick={() => navigateTab('favorites')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'favorites'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t('me.favorites', language)}
              </button>
              <button
                onClick={() => navigateTab('credits')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'credits'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t('me.credits', language)}
              </button>
              <button
                onClick={() => navigateTab('certification')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'certification'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t('me.certification', language)}
              </button>
              <button
                onClick={() => navigateTab('settings')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'settings'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t('me.settings', language)}
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'solutions' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">我的 AI 方案</h2>
              {!isLoggedIn ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                  <Lock className="mx-auto mb-2 opacity-50" size={32} />
                  <p>登录后才能查看已保存方案</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    去登录
                  </button>
                </div>
              ) : solutionLoading ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                  <Sparkles className="mx-auto mb-2 animate-pulse opacity-50" size={32} />
                  <p>正在加载方案资产...</p>
                </div>
              ) : solutionState.error ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
                  {solutionState.error}
                </div>
              ) : solutions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                  <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                  <p>还没有生成过方案</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    去创建
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {solutions.map((sol) => (
                    <div
                      key={sol.id}
                      onClick={() => openSolution(sol)}
                      className={`p-6 rounded-2xl cursor-pointer hover:border-blue-400 transition-all ${
                        isEyeCare
                          ? 'bg-white border border-stone-200'
                          : 'bg-white border border-slate-100 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{sol.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportSolution(sol, defaultExportFormat);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={`快捷导出 ${defaultExportFormat.toUpperCase()}`}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={(e) => {
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
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                        {sol.targetGoal}
                      </p>
                      <div className="flex items-center gap-2">
                        {sol.toolIds.map((tid) => {
                          const t = tools.find((mt) => mt.id === tid);
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
                        <span className="text-xs text-slate-400 ml-2">
                          {sol.createdAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div
              className={`p-8 rounded-2xl ${
                isEyeCare ? 'bg-white' : 'bg-white shadow-sm'
              }`}
            >
              <h2 className="text-xl font-bold mb-4">个人资料</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden">
                  <img
                    src="https://picsum.photos/100/100?random=user"
                    className="w-full h-full object-cover"
                    alt="User"
                  />
                </div>
                <div>
                  <div className="font-bold text-lg">{currentUser?.name || '未命名用户'}</div>
                  <div className="text-slate-500">{currentUser?.email || '未绑定邮箱'}</div>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    昵称
                  </label>
                  <input
                    type="text"
                    defaultValue={currentUser?.name || '未命名用户'}
                    className="w-full p-2 bg-slate-50 rounded-lg border-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    邮箱
                  </label>
                  <input
                    type="text"
                    defaultValue={currentUser?.email || '未绑定邮箱'}
                    disabled
                    className="w-full p-2 bg-slate-50 rounded-lg border-none opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div
              className={`p-8 rounded-2xl ${
                isEyeCare ? 'bg-white' : 'bg-white shadow-sm'
              }`}
            >
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Settings size={24} /> 设置
              </h2>
              <div className="space-y-8">
                {/* 主题 */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sun size={16} /> 外观主题
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setThemeMode('light')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        themeMode === 'light'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Sun size={20} className={`mx-auto mb-2 ${themeMode === 'light' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className={`text-sm font-bold ${themeMode === 'light' ? 'text-blue-600' : 'text-slate-600'}`}>标准模式</div>
                    </button>
                    <button
                      onClick={() => setThemeMode('eye-care')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        themeMode === 'eye-care'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Moon size={20} className={`mx-auto mb-2 ${themeMode === 'eye-care' ? 'text-amber-600' : 'text-slate-400'}`} />
                      <div className={`text-sm font-bold ${themeMode === 'eye-care' ? 'text-amber-600' : 'text-slate-600'}`}>护眼模式</div>
                    </button>
                  </div>
                </div>
                {/* 语言 */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Languages size={16} /> 语言
                  </h3>
                  <div className="flex gap-3">
                    {(['zh', 'en'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                          language === lang
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {lang === 'zh' ? '中文' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 默认导出格式 */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={16} /> 默认导出格式
                  </h3>
                  <div className="flex gap-3">
                    {(['md', 'txt', 'csv'] as ExportFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setDefaultExportFormat(fmt)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold uppercase transition-all ${
                          defaultExportFormat === fmt
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">“我的方案”快捷导出将使用此格式</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Github size={16} /> GitHub 账号
                  </h3>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">绑定 GitHub</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          使用已登录的全球站账号发起绑定，后续可直接通过 GitHub OAuth 登录。
                        </div>
                      </div>
                      <button
                        onClick={() => void startGitHubBind()}
                        disabled={!isLoggedIn || githubOAuthLoading || !githubOAuthConfigured}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                          !isLoggedIn || githubOAuthLoading || !githubOAuthConfigured
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <Github size={16} />
                        {githubOAuthLoading ? '检查中' : githubOAuthConfigured ? '绑定 GitHub' : '尚未配置'}
                      </button>
                    </div>
                    {githubOAuthError && <div className="mt-3 text-xs text-rose-700">{githubOAuthError}</div>}
                  </div>
                </div>
                {/* 账号与数据 */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck size={16} /> 账号与数据
                  </h3>
                  <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    <button
                      onClick={() => navigate('/legal/terms')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <FileText size={18} className="text-slate-400" />
                      <span className="flex-1 text-left text-slate-700">用户协议</span>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button
                      onClick={() => navigate('/legal/privacy')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <ShieldCheck size={18} className="text-slate-400" />
                      <span className="flex-1 text-left text-slate-700">隐私政策</span>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button
                      disabled
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm opacity-50 cursor-not-allowed"
                      title="即将上线"
                    >
                      <Download size={18} className="text-slate-400" />
                      <span className="flex-1 text-left text-slate-700">导出我的数据</span>
                      <span className="text-xs text-slate-400">即将上线</span>
                    </button>
                    <button
                      disabled
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm opacity-50 cursor-not-allowed"
                      title="即将上线"
                    >
                      <Trash2 size={18} className="text-slate-400" />
                      <span className="flex-1 text-left text-slate-700">申请注销账号</span>
                      <span className="text-xs text-slate-400">即将上线</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 我的额度页 */}
          {tab === 'credits' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CreditCard size={24} /> 我的额度
              </h2>
              {!isLoggedIn ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-slate-500">
                  <Lock className="mx-auto mb-2 opacity-50" size={32} />
                  登录后才能查看账号额度。
                </div>
              ) : billingState.key !== 'loaded' ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-slate-500">
                  <Clock className="mx-auto mb-2 animate-pulse opacity-50" size={32} />
                  正在加载额度信息...
                </div>
              ) : billingState.error ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
                  {billingState.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-6 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Sparkles size={20} /></div>
                        <div>
                          <h3 className="font-bold">AI 统一额度</h3>
                          <p className="text-xs text-slate-500">搜索、方案生成和导出前的 AI 能力统一扣减</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {billingState.quota?.aiCreditsRemaining ?? 0}
                        <span className="ml-1 text-sm font-medium text-slate-400">点</span>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate('/solution/new')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        <Sparkles size={18} /> 生成方案
                      </button>
                      <button
                        onClick={() => void createQuotaOrder()}
                        disabled={billingState.creating}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <CreditCard size={18} /> {billingState.creating ? '正在创建订单' : '创建 20 点手动订单'}
                      </button>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                    <h3 className="mb-3 font-bold">额度流水</h3>
                    {billingState.ledger.length === 0 ? (
                      <div className="text-sm text-slate-500">暂无额度变化记录。</div>
                    ) : (
                      <div className="space-y-2">
                        {billingState.ledger.slice(0, 6).map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                            <span className={item.delta >= 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                              {item.delta >= 0 ? '+' : ''}{item.delta} 点
                            </span>
                            <span className="text-slate-500">{item.reason}</span>
                            <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`p-5 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                    <h3 className="mb-3 font-bold">手动订单</h3>
                    {billingState.orders.length === 0 ? (
                      <div className="text-sm text-slate-500">暂无订单。创建后由后台确认支付并发放额度。</div>
                    ) : (
                      <div className="space-y-2">
                        {billingState.orders.slice(0, 6).map((order) => (
                          <div key={order.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                            <span className="font-medium">订单 {order.id}</span>
                            <span className="text-slate-500">{order.credits} 点 · {(order.amountCents / 100).toFixed(2)} {order.currency}</span>
                            <span className={order.status === 'paid' ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>
                              {order.status === 'paid' ? '已确认' : '待确认'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 学生认证页 */}
          {tab === 'certification' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <GraduationCap size={24} /> 学生认证
              </h2>
              {!isLoggedIn ? (
                // 未登录锁定态
                <div className={`p-8 rounded-2xl text-center ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                  <Lock size={48} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-bold mb-2">请先登录</h3>
                  <p className="text-sm text-slate-500 mb-6">学生认证需要登录后才能提交申请</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    去登录
                  </button>
                </div>
              ) : studentCertification.status === 'none' ? (
                // 未提交认证
                <div className={`p-8 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                  <h3 className="font-bold mb-4">选择学校并提交认证</h3>
                  <div className="space-y-3 mb-6">
                    {SCHOOLS.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => submitStudentCertification({ schoolId: school.id, schoolName: school.name })}
                        className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <GraduationCap size={20} className="text-slate-400" />
                          <span className="font-bold">{school.name}</span>
                        </div>
                        <span className="text-blue-600 text-sm font-bold">提交认证 →</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">认证通过后可解锁校内专区内容</p>
                </div>
              ) : studentCertification.status === 'pending' ? (
                // 审核中
                <div className={`p-8 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                      <Clock size={32} className="text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">审核中</h3>
                    <p className="text-sm text-slate-500 mb-2">您的认证申请正在审核，请耐心等待</p>
                    <p className="text-sm text-slate-400">学校：{studentCertification.schoolName}</p>
                  </div>
                </div>
              ) : studentCertification.status === 'rejected' ? (
                // 已驳回
                <div className={`p-8 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <X size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">认证未通过</h3>
                    <p className="text-sm text-red-500 mb-4">拒绝原因：{studentCertification.rejectReason}</p>
                    <button
                      onClick={() => resetStudentCertification()}
                      className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw size={18} /> 重新提交
                    </button>
                  </div>
                </div>
              ) : (
                // 已通过
                <div className={`p-8 rounded-2xl ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm'}`}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckSquare size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-green-700">认证已通过</h3>
                    <p className="text-sm text-slate-500 mb-6">学校：{studentCertification.schoolName}</p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      返回首页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">我的收藏</h2>

              {/* 收藏的工具 */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-slate-400" /> 收藏的工具
                </h3>
                {favoriteToolIds.size === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl">
                    <Heart className="mx-auto mb-2 opacity-50" size={28} />
                    <p className="text-sm">还没有收藏任何工具</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from(favoriteToolIds).map((toolId) => {
                      const tool = tools.find((t) => t.id === toolId);
                      if (!tool) return null;
                      return (
                        <div
                          key={toolId}
                          className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:border-blue-400 transition-all ${
                            isEyeCare
                              ? 'bg-white border border-stone-200'
                              : 'bg-white border border-slate-100 shadow-sm'
                          }`}
                          onClick={() => navigate(`/tool/${toolId}`)}
                        >
                          <img
                            src={tool.imageUrl}
                            alt={tool.name}
                            className="w-14 h-14 rounded-lg object-cover bg-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{tool.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {tool.description}
                            </p>
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                              {tool.domain}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleToolSelection(toolId);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="加入方案"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleRemoveFavorite(toolId);
                              }}
                              className="p-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                              title="取消收藏"
                            >
                              <Heart size={16} className="fill-pink-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 收藏的文章 */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-slate-400" /> 收藏的文章
                </h3>
                {favoriteArticleIds.size === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl">
                    <BookOpen className="mx-auto mb-2 opacity-50" size={28} />
                    <p className="text-sm">还没有收藏任何文章</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from(favoriteArticleIds).map((articleId) => {
                      const article = articles.find((a) => a.id === articleId);
                      if (!article) return null;
                      return (
                        <div
                          key={articleId}
                          className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:border-blue-400 transition-all ${
                            isEyeCare
                              ? 'bg-white border border-stone-200'
                              : 'bg-white border border-slate-100 shadow-sm'
                          }`}
                          onClick={() => navigate(`/article/${articleId}`)}
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            {article.imageUrl ? (
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen size={24} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{article.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {article.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                {article.domain}
                              </span>
                              <span className="text-xs text-slate-400">{article.readTime}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRemoveArticleFavorite(articleId);
                            }}
                            className="p-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="取消收藏"
                          >
                            <Heart size={16} className="fill-pink-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 全部为空时的引导 */}
              {favoriteToolIds.size === 0 && favoriteArticleIds.size === 0 && (
                <div className="text-center py-4">
                  <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 font-bold text-sm hover:underline"
                  >
                    去首页逛逛
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Side Drawer for Solution Details */}
      {viewSolution && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={closeSolution}
          ></div>
          <div
            className={`relative w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col ${
              isEyeCare ? 'bg-[#FDFCF8]' : 'bg-white'
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
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className={`p-2 rounded-full transition-colors ${
                      showShareMenu
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                    }`}
                    title="分享方案"
                  >
                    <Share2 size={24} />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                      <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">
                        分享方案
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `https://pangen-ai.com/s/${viewSolution.id}`
                          );
                          setLinkCopied(true);
                          setTimeout(() => {
                            setLinkCopied(false);
                            setShowShareMenu(false);
                          }, 1000);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                          linkCopied
                            ? 'bg-green-50 text-green-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {linkCopied ? (
                          <CheckSquare size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                        {linkCopied ? '已复制链接' : '复制链接'}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeSolution}
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
                <p className="text-slate-700 font-medium">
                  {viewSolution.targetGoal}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap size={16} /> 涉及工具
                </h3>
                <div className="flex flex-wrap gap-3">
                  {viewSolution.toolIds.map((tid) => {
                    const tool = tools.find((t) => t.id === tid);
                    return tool ? (
                      <div
                        key={tid}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all bg-white cursor-pointer"
                        onClick={() => navigate(`/tool/${tid}`)}
                      >
                        <img
                          src={tool.imageUrl}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                          alt=""
                        />
                        <div>
                          <div className="font-bold text-sm">{tool.name}</div>
                          <div className="text-xs text-slate-500">
                            {tool.domain}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                  {viewSolution.toolIds.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                      该方案未绑定具体工具
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen size={16} /> 方案建议
                </h3>
                <div
                  className={`prose max-w-none ${
                    isEyeCare ? 'prose-stone' : 'prose-slate'
                  }`}
                >
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
                        handleExportSolution(viewSolution, 'md');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => {
                        handleExportSolution(viewSolution, 'txt');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      TXT 文本
                    </button>
                    <button
                      onClick={() => {
                        handleExportSolution(viewSolution, 'csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700"
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
            className={`relative w-full max-w-sm p-6 rounded-2xl shadow-2xl ${
              isEyeCare ? 'bg-[#FDFCF8]' : 'bg-white'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-900">
                确认删除方案？
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                此操作无法撤销。该方案及其所有 AI 分析建议将被永久移除。
              </p>
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

function toUserSolution(record: SolutionRecord): UserSolution {
  return {
    id: record.id,
    title: record.title,
    targetGoal: record.targetGoal,
    toolIds: record.toolIds,
    aiAdvice: record.content,
    createdAt: new Date(record.createdAt).toLocaleDateString('zh-CN'),
  };
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[\\/:*?"<>|]+/g, '-');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
