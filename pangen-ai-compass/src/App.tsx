import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Domain, ContentType, ExperienceTab, ViewState, ThemeMode, Language, UserSolution } from './types';
import { MOCK_TOOLS, MOCK_ARTICLES, MOCK_TOPICS } from './constants';
import { Header, Footer } from './components/Layout';
import { HomeView } from './components/views/HomeView';
import { ToolDetailView } from './components/views/ToolDetailView';
import { ArticleReadView } from './components/views/ArticleReadView';
import { SolutionGenerateView } from './components/views/SolutionGenerateView';
import { LoginView } from './components/views/LoginView';
import { UserCenterView } from './components/views/UserCenterView';
import { AdminView } from './components/views/AdminView';
import { STORAGE_KEYS, storageGet, storageSet } from './utils/storage';
import { isStringArray, isUserSolutionArray, isThemeMode, isLanguage } from './utils/guards';
import { UI_COLORS, UI_DELAY } from './constants/ui';
import { exportSolutionToFile } from './utils/export';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>({ type: 'home' });

  const themeModeResult = storageGet(STORAGE_KEYS.themeMode, 'light' as ThemeMode, isThemeMode);
  const languageResult = storageGet(STORAGE_KEYS.language, 'zh' as Language, isLanguage);
  const selectedToolIdsResult = storageGet(STORAGE_KEYS.selectedToolIds, [] as string[], isStringArray);
  const userSolutionsResult = storageGet(STORAGE_KEYS.userSolutions, [] as UserSolution[], isUserSolutionArray);

  const [themeMode, setThemeMode] = useState<ThemeMode>(themeModeResult.value);
  const [language, setLanguage] = useState<Language>(languageResult.value);
  const [currentDomain, setCurrentDomain] = useState<Domain>('creative');
  const [contentType, setContentType] = useState<ContentType>(ContentType.TOOL);
  const [experienceTab, setExperienceTab] = useState<ExperienceTab>('featured');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set(selectedToolIdsResult.value));
  const [userSolutions, setUserSolutions] = useState<UserSolution[]>(userSolutionsResult.value);

  const [showStorageResetNotice, setShowStorageResetNotice] = useState<boolean>(
    themeModeResult.resetDetected ||
      languageResult.resetDetected ||
      selectedToolIdsResult.resetDetected ||
      userSolutionsResult.resetDetected
  );

  // --- Helpers ---
  const toggleTheme = () => setThemeMode(prev => (prev === 'light' ? 'eye-care' : 'light'));
  const bgClass =
    themeMode === 'eye-care'
      ? 'min-h-screen text-stone-800'
      : 'bg-slate-50 min-h-screen text-slate-900';
  const rootStyle = themeMode === 'eye-care' ? { backgroundColor: UI_COLORS.EYE_CARE_BG } : undefined;

  useEffect(() => {
    storageSet(STORAGE_KEYS.themeMode, themeMode);
  }, [themeMode]);

  useEffect(() => {
    storageSet(STORAGE_KEYS.language, language);
  }, [language]);

  useEffect(() => {
    storageSet(STORAGE_KEYS.selectedToolIds, Array.from(selectedToolIds));
  }, [selectedToolIds]);

  useEffect(() => {
    storageSet(STORAGE_KEYS.userSolutions, userSolutions);
  }, [userSolutions]);

  useEffect(() => {
    if (!showStorageResetNotice) return;
    const t = window.setTimeout(() => setShowStorageResetNotice(false), UI_DELAY.TOAST_AUTO_HIDE);
    return () => window.clearTimeout(t);
  }, [showStorageResetNotice]);

  const toggleToolSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedToolIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedToolIds(new Set());
  };

  const saveMockSolution = (solution: UserSolution) => {
    setUserSolutions(prev => [solution, ...prev]);
    setView({ type: 'user-center', tab: 'solutions' });
  };

  const deleteSolution = (id: string) => {
    setUserSolutions(prev => prev.filter(s => s.id !== id));
  };

  const handleExportSolution = (sol: UserSolution, format: 'md' | 'txt' | 'csv') => {
    exportSolutionToFile(sol, format, MOCK_TOOLS);
  };

  // --- Filtering ---
  const filteredTools = MOCK_TOOLS.filter(t => t.domain === currentDomain);
  const filteredTopics = MOCK_TOPICS.filter(t => t.domain === currentDomain);
  const featuredArticles = MOCK_ARTICLES.filter(a => a.domain === currentDomain && a.isFeatured && !a.topicId);
  const plazaArticles = MOCK_ARTICLES.filter(a => a.domain === currentDomain && !a.isFeatured);
  const domainArticles = MOCK_ARTICLES.filter(a => a.domain === currentDomain);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${bgClass}`} style={rootStyle}>
      {showStorageResetNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] px-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg">
            <AlertTriangle size={16} className="text-amber-300" />
            <span className="text-sm font-medium">本地数据异常，系统已重置到默认状态。</span>
            <button
              type="button"
              onClick={() => setShowStorageResetNotice(false)}
              className="ml-1 p-1 rounded-full hover:bg-white/10"
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <Header
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        navigate={setView}
        currentView={view}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        currentDomain={currentDomain}
        setDomain={setCurrentDomain}
      />

      <main className="flex-grow pt-6">
        {view.type === 'home' && (
          <HomeView
            themeMode={themeMode}
            contentType={contentType}
            setContentType={setContentType}
            experienceTab={experienceTab}
            setExperienceTab={setExperienceTab}
            tools={filteredTools}
            topics={filteredTopics}
            featuredArticles={featuredArticles}
            plazaArticles={plazaArticles}
            domainArticles={domainArticles}
            selectedToolIds={selectedToolIds}
            toggleToolSelection={toggleToolSelection}
            clearSelection={clearSelection}
            navigate={setView}
          />
        )}

        {view.type === 'tool-detail' && (
          <ToolDetailView toolId={view.toolId} themeMode={themeMode} navigate={setView} />
        )}

        {view.type === 'article-read' && (
          <ArticleReadView
            articleId={view.articleId}
            topicId={view.topicId}
            themeMode={themeMode}
            navigate={setView}
          />
        )}

        {view.type === 'login' && (
          <LoginView
            themeMode={themeMode}
            onLogin={() => {
              setIsLoggedIn(true);
              setView({ type: 'home' });
            }}
          />
        )}

        {view.type === 'solution-generate' && (
          <SolutionGenerateView
            toolIds={view.toolIds}
            themeMode={themeMode}
            navigate={setView}
            onSaveSolution={saveMockSolution}
          />
        )}

        {view.type === 'user-center' && (
          <UserCenterView
            tab={view.tab}
            themeMode={themeMode}
            userSolutions={userSolutions}
            navigate={setView}
            setContentType={setContentType}
            onExportSolution={handleExportSolution}
            onDeleteSolution={deleteSolution}
          />
        )}

        {view.type === 'admin' && <AdminView navigate={setView} />}
      </main>

      <Footer />
    </div>
  );
};

export default App;