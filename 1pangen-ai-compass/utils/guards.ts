import { UserSolution, ThemeMode, Language } from '../types';

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(v => typeof v === 'string');

export const isUserSolution = (value: unknown): value is UserSolution => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.targetGoal === 'string' &&
    Array.isArray(v.toolIds) &&
    v.toolIds.every(tid => typeof tid === 'string') &&
    typeof v.aiAdvice === 'string' &&
    typeof v.createdAt === 'string'
  );
};

export const isUserSolutionArray = (value: unknown): value is UserSolution[] =>
  Array.isArray(value) && value.every(isUserSolution);

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'eye-care';

export const isLanguage = (value: unknown): value is Language =>
  value === 'zh' || value === 'en' || value === 'jp' || value === 'ru';
