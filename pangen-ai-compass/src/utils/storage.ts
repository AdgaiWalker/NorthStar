export const STORAGE_KEYS = {
  themeMode: 'pangen.themeMode',
  language: 'pangen.language',
  selectedToolIds: 'pangen.selectedToolIds',
  userSolutions: 'pangen.userSolutions',
  analyticsEvents: 'pangen.analyticsEvents',

  // 游客额度（本地存储）
  guestQuotaAiSearch: 'pangen.quota.guest.aiSearch',
  guestQuotaAiSolution: 'pangen.quota.guest.aiSolution',
  guestQuotaResetAt: 'pangen.quota.guest.resetAt',

  // 收藏与设置
  favoriteToolIds: 'pangen.favoriteToolIds',
  defaultExportFormat: 'pangen.export.defaultFormat',

  // 学生认证
  studentCertification: 'pangen.user.studentCertification',

  // 内容管理（本地 mock）
  contentItems: 'pangen.content.items',
  contentAssets: 'pangen.content.assets',
  contentFolders: 'pangen.content.folders',
} as const;

export interface StorageReadResult<T> {
  value: T;
  resetDetected: boolean;
}

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const storageGet = <T>(key: string, defaultValue: T, validator: (v: unknown) => v is T): StorageReadResult<T> => {
  const saved = localStorage.getItem(key);
  if (saved === null) {
    return { value: defaultValue, resetDetected: false };
  }
  const parsed = safeJsonParse(saved);
  if (validator(parsed)) {
    return { value: parsed, resetDetected: false };
  }
  localStorage.removeItem(key);
  return { value: defaultValue, resetDetected: true };
};

export const storageSet = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const storageRemove = (key: string): void => {
  localStorage.removeItem(key);
};
