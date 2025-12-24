import { UserSolution, ThemeMode, Language, ExportFormat, CertificationStatus, StudentCertification } from '../types';

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(v => typeof v === 'string');

// 导出格式校验
export const isExportFormat = (value: unknown): value is ExportFormat =>
  value === 'md' || value === 'txt' || value === 'csv';

// 认证状态校验
const isCertificationStatus = (value: unknown): value is CertificationStatus =>
  value === 'none' || value === 'pending' || value === 'verified' || value === 'rejected';

// 学生认证对象校验
export const isStudentCertification = (value: unknown): value is StudentCertification => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!isCertificationStatus(v.status)) return false;
  // 可选字段类型校验
  if (v.schoolId !== undefined && typeof v.schoolId !== 'string') return false;
  if (v.schoolName !== undefined && typeof v.schoolName !== 'string') return false;
  if (v.submittedAt !== undefined && typeof v.submittedAt !== 'string') return false;
  if (v.reviewedAt !== undefined && typeof v.reviewedAt !== 'string') return false;
  if (v.rejectReason !== undefined && typeof v.rejectReason !== 'string') return false;
  return true;
};

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
  value === 'zh' || value === 'en';
