import { create } from 'zustand';
import { ThemeMode, Language, UserSolution, Domain } from '../types';
import { STORAGE_KEYS, storageGet, storageSet } from '../utils/storage';
import { isThemeMode, isLanguage, isStringArray, isUserSolutionArray } from '../utils/guards';

// 初始化时从 localStorage 读取
const initTheme = storageGet(STORAGE_KEYS.themeMode, 'light' as ThemeMode, isThemeMode);
const initLang = storageGet(STORAGE_KEYS.language, 'zh' as Language, isLanguage);
const initSelectedToolIds = storageGet(STORAGE_KEYS.selectedToolIds, [] as string[], isStringArray);
const initUserSolutions = storageGet(STORAGE_KEYS.userSolutions, [] as UserSolution[], isUserSolutionArray);

interface AppState {
  // 主题与语言
  themeMode: ThemeMode;
  language: Language;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;

  // 领域
  currentDomain: Domain;
  setCurrentDomain: (domain: Domain) => void;

  // 登录状态（前端模拟）
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;

  // 已选工具
  selectedToolIds: Set<string>;
  toggleToolSelection: (id: string) => void;
  clearSelection: () => void;
  getSelectedToolIdsArray: () => string[];

  // 用户方案
  userSolutions: UserSolution[];
  saveSolution: (solution: UserSolution) => void;
  deleteSolution: (id: string) => void;

  // 存储重置检测
  storageResetDetected: boolean;
  dismissStorageResetNotice: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始值
  themeMode: initTheme.value,
  language: initLang.value,
  currentDomain: 'creative',
  isLoggedIn: false,
  selectedToolIds: new Set(initSelectedToolIds.value),
  userSolutions: initUserSolutions.value,
  storageResetDetected:
    initTheme.resetDetected ||
    initLang.resetDetected ||
    initSelectedToolIds.resetDetected ||
    initUserSolutions.resetDetected,

  // 主题
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    storageSet(STORAGE_KEYS.themeMode, mode);
  },
  toggleTheme: () => {
    const next = get().themeMode === 'light' ? 'eye-care' : 'light';
    set({ themeMode: next });
    storageSet(STORAGE_KEYS.themeMode, next);
  },

  // 语言
  setLanguage: (lang) => {
    set({ language: lang });
    storageSet(STORAGE_KEYS.language, lang);
  },

  // 领域
  setCurrentDomain: (domain) => set({ currentDomain: domain }),

  // 登录
  setIsLoggedIn: (v) => set({ isLoggedIn: v }),

  // 工具选择
  toggleToolSelection: (id) => {
    const prev = get().selectedToolIds;
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedToolIds: next });
    storageSet(STORAGE_KEYS.selectedToolIds, Array.from(next));
  },
  clearSelection: () => {
    set({ selectedToolIds: new Set() });
    storageSet(STORAGE_KEYS.selectedToolIds, []);
  },
  getSelectedToolIdsArray: () => Array.from(get().selectedToolIds),

  // 方案
  saveSolution: (solution) => {
    const next = [solution, ...get().userSolutions];
    set({ userSolutions: next });
    storageSet(STORAGE_KEYS.userSolutions, next);
  },
  deleteSolution: (id) => {
    const next = get().userSolutions.filter((s) => s.id !== id);
    set({ userSolutions: next });
    storageSet(STORAGE_KEYS.userSolutions, next);
  },

  // 存储重置提示
  dismissStorageResetNotice: () => set({ storageResetDetected: false }),
}));
