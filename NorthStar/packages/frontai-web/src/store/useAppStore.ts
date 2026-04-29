import { create } from 'zustand';
import { ThemeMode, Language, Domain, ExportFormat, StudentCertification, User } from '@/types';
import type { IdentitySession, IdentityUser, PlatformRole } from '@ns/shared';
import { STORAGE_KEYS, storageGet, storageRemove, storageSet } from '@/utils/storage';
import { isThemeMode, isLanguage, isStringArray, isExportFormat, isStudentCertification } from '@/utils/guards';

// 初始化时从 localStorage 读取
const initTheme = storageGet(STORAGE_KEYS.themeMode, 'light' as ThemeMode, isThemeMode);
const initLang = storageGet(STORAGE_KEYS.language, 'zh' as Language, isLanguage);
const initSelectedToolIds = storageGet(STORAGE_KEYS.selectedToolIds, [] as string[], isStringArray);
const initFavoriteToolIds = storageGet(STORAGE_KEYS.favoriteToolIds, [] as string[], isStringArray);
const initDefaultExportFormat = storageGet(STORAGE_KEYS.defaultExportFormat, 'md' as ExportFormat, isExportFormat);
const initStudentCert = storageGet(STORAGE_KEYS.studentCertification, { status: 'none' } as StudentCertification, isStudentCertification);
const initAuthToken = storageGet(STORAGE_KEYS.identityToken, null as string | null, isNullableString);
const initIdentityUser = storageGet(STORAGE_KEYS.identityUser, null as IdentityUser | null, isNullableIdentityUser);

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

  // 登录状态
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  authToken: string | null;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setIdentitySession: (session: IdentitySession) => void;
  setIdentityUser: (user: IdentityUser | null) => void;
  logout: () => void;

  // 已选工具
  selectedToolIds: Set<string>;
  toggleToolSelection: (id: string) => void;
  clearSelection: () => void;
  getSelectedToolIdsArray: () => string[];

  // 收藏
  favoriteToolIds: Set<string>;
  favoriteArticleIds: Set<string>;
  favoriteTopicIds: Set<string>;
  toggleFavoriteTool: (toolId: string) => void;
  setFavoriteToolIds: (toolIds: string[]) => void;
  setFavoriteArticleIds: (ids: string[]) => void;
  setFavoriteTopicIds: (ids: string[]) => void;
  isToolFavorited: (toolId: string) => boolean;
  isArticleFavorited: (id: string) => boolean;
  isTopicFavorited: (id: string) => boolean;
  toggleFavoriteArticle: (id: string) => void;
  toggleFavoriteTopic: (id: string) => void;

  // 默认导出格式
  defaultExportFormat: ExportFormat;
  setDefaultExportFormat: (fmt: ExportFormat) => void;

  // 学生认证（前端演示状态机）
  studentCertification: StudentCertification;
  submitStudentCertification: (payload: { schoolId: string; schoolName: string }) => void;
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
  isLoggedIn: Boolean(initAuthToken.value && initIdentityUser.value),
  authToken: initAuthToken.value,
  selectedToolIds: new Set(initSelectedToolIds.value),
  favoriteToolIds: new Set(initFavoriteToolIds.value),
  favoriteArticleIds: new Set<string>(),
  favoriteTopicIds: new Set<string>(),
  defaultExportFormat: initDefaultExportFormat.value,
  studentCertification: initStudentCert.value,
  storageResetDetected:
    initTheme.resetDetected ||
    initLang.resetDetected ||
    initSelectedToolIds.resetDetected ||
    initFavoriteToolIds.resetDetected ||
    initDefaultExportFormat.resetDetected ||
    initStudentCert.resetDetected ||
    initAuthToken.resetDetected ||
    initIdentityUser.resetDetected,

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
  setIsLoggedIn: (v) => {
    if (!v) {
      get().logout();
      return;
    }
    set({ isLoggedIn: true });
  },
  currentUser: initIdentityUser.value ? toCompassUser(initIdentityUser.value) : null,
  setCurrentUser: (user) => set({ currentUser: user }),
  setIdentitySession: (session) => {
    set({
      isLoggedIn: true,
      authToken: session.token,
      currentUser: toCompassUser(session.user),
    });
    storageSet(STORAGE_KEYS.identityToken, session.token);
    storageSet(STORAGE_KEYS.identityUser, session.user);
  },
  setIdentityUser: (user) => {
    set({ currentUser: user ? toCompassUser(user) : null, isLoggedIn: Boolean(user && get().authToken) });
    if (user) {
      storageSet(STORAGE_KEYS.identityUser, user);
    } else {
      storageRemove(STORAGE_KEYS.identityUser);
    }
  },
  logout: () => {
    set({ isLoggedIn: false, authToken: null, currentUser: null });
    storageRemove(STORAGE_KEYS.identityToken);
    storageRemove(STORAGE_KEYS.identityUser);
  },

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
  setFavoriteToolIds: (toolIds) => {
    const next = new Set(toolIds);
    set({ favoriteToolIds: next });
    storageSet(STORAGE_KEYS.favoriteToolIds, Array.from(next));
  },
  isToolFavorited: (toolId) => get().favoriteToolIds.has(toolId),
  setFavoriteArticleIds: (ids) => set({ favoriteArticleIds: new Set(ids) }),
  setFavoriteTopicIds: (ids) => set({ favoriteTopicIds: new Set(ids) }),
  isArticleFavorited: (id) => get().favoriteArticleIds.has(id),
  isTopicFavorited: (id) => get().favoriteTopicIds.has(id),
  toggleFavoriteArticle: (id) => {
    const prev = get().favoriteArticleIds;
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ favoriteArticleIds: next });
  },
  toggleFavoriteTopic: (id) => {
    const prev = get().favoriteTopicIds;
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ favoriteTopicIds: next });
  },

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
  resetStudentCertification: () => {
    const cert: StudentCertification = { status: 'none' };
    set({ studentCertification: cert });
    storageSet(STORAGE_KEYS.studentCertification, cert);
  },

  // 存储重置提示
  dismissStorageResetNotice: () => set({ storageResetDetected: false }),
}));

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isNullableIdentityUser(value: unknown): value is IdentityUser | null {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<IdentityUser>;
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.emailVerified === 'boolean' &&
    (user.site === 'cn' || user.site === 'com') &&
    isPlatformRole(user.role)
  );
}

function isPlatformRole(value: unknown): value is PlatformRole {
  return (
    value === 'visitor' ||
    value === 'user' ||
    value === 'editor' ||
    value === 'reviewer' ||
    value === 'operator' ||
    value === 'admin'
  );
}

function toCompassUser(user: IdentityUser): User {
  return {
    id: user.id,
    name: user.name || user.username,
    email: user.email,
    avatar: '',
    role: mapRole(user.role),
    isPro: user.role !== 'user',
  };
}

function mapRole(role: PlatformRole): User['role'] {
  if (role === 'admin') return 'admin';
  if (role === 'editor') return 'editor';
  if (role === 'reviewer') return 'reviewer';
  if (role === 'operator') return 'admin';
  return 'user';
}
