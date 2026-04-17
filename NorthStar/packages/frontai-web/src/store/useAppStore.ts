import { create } from 'zustand';
import { ThemeMode, Language, UserSolution, Domain, ExportFormat, StudentCertification, User } from '@/types';
import { STORAGE_KEYS, storageGet, storageSet } from '@/utils/storage';
import { isThemeMode, isLanguage, isStringArray, isUserSolutionArray, isExportFormat, isStudentCertification } from '@/utils/guards';

// 初始化时从 localStorage 读取
const initTheme = storageGet(STORAGE_KEYS.themeMode, 'light' as ThemeMode, isThemeMode);
const initLang = storageGet(STORAGE_KEYS.language, 'zh' as Language, isLanguage);
const initSelectedToolIds = storageGet(STORAGE_KEYS.selectedToolIds, [] as string[], isStringArray);
const initUserSolutions = storageGet(STORAGE_KEYS.userSolutions, [] as UserSolution[], isUserSolutionArray);
const initFavoriteToolIds = storageGet(STORAGE_KEYS.favoriteToolIds, [] as string[], isStringArray);
const initDefaultExportFormat = storageGet(STORAGE_KEYS.defaultExportFormat, 'md' as ExportFormat, isExportFormat);
const initStudentCert = storageGet(STORAGE_KEYS.studentCertification, { status: 'none' } as StudentCertification, isStudentCertification);

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
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // 已选工具
  selectedToolIds: Set<string>;
  toggleToolSelection: (id: string) => void;
  clearSelection: () => void;
  getSelectedToolIdsArray: () => string[];

  // 用户方案
  userSolutions: UserSolution[];
  saveSolution: (solution: UserSolution) => void;
  deleteSolution: (id: string) => void;

  // 收藏
  favoriteToolIds: Set<string>;
  toggleFavoriteTool: (toolId: string) => void;
  isToolFavorited: (toolId: string) => boolean;

  // 默认导出格式
  defaultExportFormat: ExportFormat;
  setDefaultExportFormat: (fmt: ExportFormat) => void;

  // 学生认证（前端演示状态机）
  studentCertification: StudentCertification;
  submitStudentCertification: (payload: { schoolId: string; schoolName: string }) => void;
  mockApproveStudentCertification: () => void;
  mockRejectStudentCertification: (reason: string) => void;
  resetStudentCertification: () => void;

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
  favoriteToolIds: new Set(initFavoriteToolIds.value),
  defaultExportFormat: initDefaultExportFormat.value,
  studentCertification: initStudentCert.value,
  storageResetDetected:
    initTheme.resetDetected ||
    initLang.resetDetected ||
    initSelectedToolIds.resetDetected ||
    initUserSolutions.resetDetected ||
    initFavoriteToolIds.resetDetected ||
    initDefaultExportFormat.resetDetected ||
    initStudentCert.resetDetected,

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
  currentUser: null, // 默认无用户，或 mock 一个 superadmin
  setCurrentUser: (user) => set({ currentUser: user }),

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

  // 收藏
  toggleFavoriteTool: (toolId) => {
    const prev = get().favoriteToolIds;
    const next = new Set(prev);
    if (next.has(toolId)) {
      next.delete(toolId);
    } else {
      next.add(toolId);
    }
    set({ favoriteToolIds: next });
    storageSet(STORAGE_KEYS.favoriteToolIds, Array.from(next));
  },
  isToolFavorited: (toolId) => get().favoriteToolIds.has(toolId),

  // 默认导出格式
  setDefaultExportFormat: (fmt) => {
    set({ defaultExportFormat: fmt });
    storageSet(STORAGE_KEYS.defaultExportFormat, fmt);
  },

  // 学生认证状态机
  submitStudentCertification: (payload) => {
    const cert: StudentCertification = {
      status: 'pending',
      schoolId: payload.schoolId,
      schoolName: payload.schoolName,
      submittedAt: new Date().toISOString(),
    };
    set({ studentCertification: cert });
    storageSet(STORAGE_KEYS.studentCertification, cert);
  },
  mockApproveStudentCertification: () => {
    const prev = get().studentCertification;
    const cert: StudentCertification = {
      ...prev,
      status: 'verified',
      reviewedAt: new Date().toISOString(),
      rejectReason: undefined,
    };
    set({ studentCertification: cert });
    storageSet(STORAGE_KEYS.studentCertification, cert);
  },
  mockRejectStudentCertification: (reason) => {
    const prev = get().studentCertification;
    const cert: StudentCertification = {
      ...prev,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      rejectReason: reason,
    };
    set({ studentCertification: cert });
    storageSet(STORAGE_KEYS.studentCertification, cert);
  },
  resetStudentCertification: () => {
    const cert: StudentCertification = { status: 'none' };
    set({ studentCertification: cert });
    storageSet(STORAGE_KEYS.studentCertification, cert);
  },

  // 存储重置提示
  dismissStorageResetNotice: () => set({ storageResetDetected: false }),
}));
