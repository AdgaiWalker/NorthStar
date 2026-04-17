import { UserSolution, ThemeMode, Language, ExportFormat, CertificationStatus, StudentCertification, ContentItem, ContentAsset, ContentVisibility, ContentStatus, FolderMeta, Domain } from '@/types';

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

// ---- 内容管理（本地 mock）校验 ----
export const isContentVisibility = (value: unknown): value is ContentVisibility =>
  value === 'public' || value === 'campus';

export const isContentStatus = (value: unknown): value is ContentStatus =>
  value === 'draft' || value === 'published';

export const isContentItem = (value: unknown): value is ContentItem => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  // 必填字段
  const hasBasics =
    typeof v.id === 'string' &&
    v.type === 'article' &&
    typeof v.title === 'string' &&
    typeof v.summary === 'string' &&
    typeof v.coverImageUrl === 'string' &&
    (v.domain === 'creative' || v.domain === 'dev' || v.domain === 'work') &&
    isContentStatus(v.status) &&
    isContentVisibility(v.visibility) &&
    Array.isArray(v.tags) && v.tags.every((t) => typeof t === 'string') &&
    Array.isArray(v.relatedToolIds) && v.relatedToolIds.every((t) => typeof t === 'string') &&
    typeof v.markdown === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string';
  if (!hasBasics) return false;
  if (!v.stats || typeof v.stats !== 'object') return false;
  const stats = v.stats as Record<string, unknown>;
  if (typeof stats.views !== 'number') return false;
  if (typeof stats.likes !== 'number') return false;
  // 可选字段类型
  if (v.schoolId !== undefined && typeof v.schoolId !== 'string') return false;
  if (v.schoolName !== undefined && typeof v.schoolName !== 'string') return false;
  if (v.publishedAt !== undefined && typeof v.publishedAt !== 'string') return false;
  return true;
};

export const isContentItemArray = (value: unknown): value is ContentItem[] =>
  Array.isArray(value) && value.every(isContentItem);

export const isContentAsset = (value: unknown): value is ContentAsset => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.mime === 'string' &&
    typeof v.size === 'number' &&
    typeof v.dataUrl === 'string' &&
    typeof v.createdAt === 'string'
  );
};

export const isContentAssetArray = (value: unknown): value is ContentAsset[] =>
  Array.isArray(value) && value.every(isContentAsset);

// ---- 文件夹元数据校验 ----
const isDomain = (value: unknown): value is Domain =>
  value === 'creative' || value === 'dev' || value === 'work';

export const isFolderMeta = (value: unknown): value is FolderMeta => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.path !== 'string') return false;
  if (v.domain !== undefined && !isDomain(v.domain)) return false;
  if (typeof v.createdAt !== 'string') return false;
  return true;
};

export const isFolderMetaArray = (value: unknown): value is FolderMeta[] =>
  Array.isArray(value) && value.every(isFolderMeta);
