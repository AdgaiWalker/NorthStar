import { Reviewer, ReviewerRole, ReviewTaskStatus } from '@/types/review';

/**
 * 审核工作台权限工具函数（前端演示版）
 * - reviewer：不可改派
 * - editor：仅可改派 assigned
 * - admin：可强制改派 in_review（必须填写原因）
 */

export const getCurrentReviewerRole = (
  reviewers: Reviewer[],
  currentUserId: string
): ReviewerRole => {
  const me = reviewers.find((r) => r.id === currentUserId);
  return me?.role ?? 'admin';
};

export const canReassignTask = (
  status: ReviewTaskStatus,
  role: ReviewerRole
): boolean => {
  if (role === 'reviewer') return false;
  if (status === 'assigned') return true;
  if (status === 'in_review') return role === 'admin';
  return false;
};

export const requiresForceReason = (status: ReviewTaskStatus): boolean =>
  status === 'in_review';
