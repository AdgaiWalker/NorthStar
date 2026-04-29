import { CertificationStatus, ExportFormat, Language, StudentCertification, ThemeMode } from '@/types';

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isExportFormat = (value: unknown): value is ExportFormat =>
  value === 'md' || value === 'txt' || value === 'csv';

const isCertificationStatus = (value: unknown): value is CertificationStatus =>
  value === 'none' || value === 'pending' || value === 'verified' || value === 'rejected';

export const isStudentCertification = (value: unknown): value is StudentCertification => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (!isCertificationStatus(record.status)) return false;
  if (record.schoolId !== undefined && typeof record.schoolId !== 'string') return false;
  if (record.schoolName !== undefined && typeof record.schoolName !== 'string') return false;
  if (record.submittedAt !== undefined && typeof record.submittedAt !== 'string') return false;
  if (record.reviewedAt !== undefined && typeof record.reviewedAt !== 'string') return false;
  if (record.rejectReason !== undefined && typeof record.rejectReason !== 'string') return false;
  return true;
};

export const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'eye-care';

export const isLanguage = (value: unknown): value is Language => value === 'zh' || value === 'en';
