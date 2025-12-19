export const STORAGE_KEYS = {
  themeMode: 'pangen.themeMode',
  language: 'pangen.language',
  selectedToolIds: 'pangen.selectedToolIds',
  userSolutions: 'pangen.userSolutions',
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
