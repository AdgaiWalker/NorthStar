/**
 * 审核任务状态
 */
export type ReviewTaskStatus =
  | 'pending_review'  // 待分配/待审核
  | 'assigned'        // 已分配，待开始
  | 'in_review'       // 审核中
  | 'approved'        // 已批准
  | 'rejected'        // 已退回
  | 'revision'        // 作者修订中
  | 'unassigned';     // 进入待分配池

/**
 * 待分配池原因
 */
export type UnassignedReason =
  | 'no_reviewer_available'
  | 'all_reviewers_over_capacity'
  | 'no_reviewer_for_domain'
  | 'policy_blocked';

/**
 * 审核任务
 */
export interface ReviewTask {
  id: string;
  title: string;
  contentType: 'article' | 'tool' | 'video_doc';
  domain: 'dev' | 'creative' | 'work';
  authorId: string;
  authorName: string;
  status: ReviewTaskStatus;
  assignedTo?: string;        // 审核员 ID
  assignedAt?: number;        // 分配时间戳
  createdAt: number;          // 提交时间
  updatedAt: number;
  slaDeadline?: number;       // SLA 截止（分配后 48h）
  content: string;            // Markdown 内容
  revisionOf?: string;        // 如果是修订，指向原任务 ID
  unassignedReason?: UnassignedReason;
  unassignedAt?: number;
}

/**
 * 审核员角色
 */
export type ReviewerRole = 'reviewer' | 'editor' | 'admin';

/**
 * 审核员
 */
export interface Reviewer {
  id: string;
  name: string;
  role: ReviewerRole;
  domains: ('dev' | 'creative' | 'work')[];
  isPaused: boolean;          // 是否暂停接单
  wipCount: number;           // 当前处理中任务数
  lastAssignedAt?: number;
}

/**
 * 审计日志动作
 */
export type AuditAction =
  | 'submit'
  | 'assign'
  | 'reassign'
  | 'start_review'
  | 'approve'
  | 'reject'
  | 'revision_submit'
  | 'ai_run'
  | 'ai_apply'
  | 'ai_rollback'
  | 'pause_reviewer'
  | 'resume_reviewer'
  | 'manual_unassign'
  | 'auto_unassign';

/**
 * 审计日志
 */
export interface AuditLog {
  id: string;
  timestamp: number;
  action: AuditAction;
  taskId?: string;
  taskTitle?: string;
  operatorId: string;
  operatorName: string;
  targetId?: string;          // 目标审核员 ID（改派时）
  note?: string;
}

// --------------------------
// 常量
// --------------------------
export const WIP_LIMIT = 10;
export const SLA_HOURS = 48;
