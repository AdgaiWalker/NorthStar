import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ReviewTask,
  Reviewer,
  AuditLog,
  AuditAction,
  UnassignedReason,
  WIP_LIMIT,
  SLA_HOURS,
} from '../types/review';

// --------------------------
// 工具函数
// --------------------------
const genId = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const slaDeadline = () => now() + SLA_HOURS * 60 * 60 * 1000;

// --------------------------
// Store 类型
// --------------------------
interface ReviewState {
  tasks: ReviewTask[];
  reviewers: Reviewer[];
  auditLogs: AuditLog[];
  currentUserId: string;
  currentUserName: string;

  // 任务操作
  submitTask: (task: Omit<ReviewTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => ReviewTask;
  assignTask: (taskId: string, reviewerId: string) => void;
  startReview: (taskId: string) => void;
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string, reason: string) => void;
  submitRevision: (originalTaskId: string, newContent: string) => ReviewTask;
  reassignTask: (taskId: string, newReviewerId: string, forceReason?: string) => void;
  moveToUnassigned: (taskId: string, reason: UnassignedReason) => void;

  // 自动分配
  autoAssign: (taskId: string) => boolean;

  // 审核员操作
  addReviewer: (reviewer: Omit<Reviewer, 'id' | 'wipCount' | 'isPaused'>) => void;
  pauseReviewer: (reviewerId: string) => void;
  resumeReviewer: (reviewerId: string) => void;

  // 审计
  writeAudit: (action: AuditAction, taskId?: string, taskTitle?: string, note?: string, targetId?: string) => void;
}

// --------------------------
// Store 实现
// --------------------------
export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      tasks: [],
      reviewers: [],
      auditLogs: [],
      currentUserId: 'admin',
      currentUserName: '系统管理员',

      // ----- 审计 -----
      writeAudit: (action, taskId, taskTitle, note, targetId) => {
        const log: AuditLog = {
          id: genId(),
          timestamp: now(),
          action,
          taskId,
          taskTitle,
          operatorId: get().currentUserId,
          operatorName: get().currentUserName,
          targetId,
          note,
        };
        set((s) => ({ auditLogs: [log, ...s.auditLogs].slice(0, 500) }));
      },

      // ----- 任务操作 -----
      submitTask: (taskData) => {
        const task: ReviewTask = {
          ...taskData,
          id: genId(),
          status: 'pending_review',
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        get().writeAudit('submit', task.id, task.title);

        // 尝试自动分配
        get().autoAssign(task.id);
        return task;
      },

      autoAssign: (taskId) => {
        const { tasks, reviewers, writeAudit } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status !== 'pending_review') return false;

        // 如果是修订，优先分配给原审核员
        let preferredReviewerId: string | undefined;
        if (task.revisionOf) {
          const original = tasks.find((t) => t.id === task.revisionOf);
          if (original?.assignedTo) preferredReviewerId = original.assignedTo;
        }

        // 候选：未暂停、负责该领域、WIP < 限制
        const candidates = reviewers.filter(
          (r) =>
            !r.isPaused &&
            r.domains.includes(task.domain) &&
            r.wipCount < WIP_LIMIT
        );

        if (candidates.length === 0) {
          // 进入待分配池
          const reason: UnassignedReason = reviewers.some((r) => r.domains.includes(task.domain))
            ? 'all_reviewers_over_capacity'
            : 'no_reviewer_for_domain';
          get().moveToUnassigned(taskId, reason);
          return false;
        }

        // 优先选择 preferredReviewerId
        let chosen = preferredReviewerId
          ? candidates.find((r) => r.id === preferredReviewerId)
          : undefined;

        if (!chosen) {
          // 按最少负载 + 最旧 lastAssignedAt 排序
          const sorted = [...candidates].sort((a, b) => {
            if (a.wipCount !== b.wipCount) return a.wipCount - b.wipCount;
            return (a.lastAssignedAt ?? 0) - (b.lastAssignedAt ?? 0);
          });
          chosen = sorted[0];
        }

        if (!chosen) {
          get().moveToUnassigned(taskId, 'no_reviewer_available');
          return false;
        }

        // 执行分配
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'assigned',
                  assignedTo: chosen!.id,
                  assignedAt: now(),
                  slaDeadline: slaDeadline(),
                  updatedAt: now(),
                }
              : t
          ),
          reviewers: s.reviewers.map((r) =>
            r.id === chosen!.id
              ? { ...r, wipCount: r.wipCount + 1, lastAssignedAt: now() }
              : r
          ),
        }));
        writeAudit('assign', taskId, task.title, undefined, chosen.id);
        return true;
      },

      assignTask: (taskId, reviewerId) => {
        const { tasks, reviewers, writeAudit, moveToUnassigned } = get();
        const task = tasks.find((t) => t.id === taskId);
        const reviewer = reviewers.find((r) => r.id === reviewerId);
        if (!task || !reviewer) return;

        if (reviewer.wipCount >= WIP_LIMIT) {
          moveToUnassigned(taskId, 'all_reviewers_over_capacity');
          return;
        }

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'assigned',
                  assignedTo: reviewerId,
                  assignedAt: now(),
                  slaDeadline: slaDeadline(),
                  updatedAt: now(),
                  unassignedReason: undefined,
                  unassignedAt: undefined,
                }
              : t
          ),
          reviewers: s.reviewers.map((r) =>
            r.id === reviewerId
              ? { ...r, wipCount: r.wipCount + 1, lastAssignedAt: now() }
              : r
          ),
        }));
        writeAudit('assign', taskId, task.title, undefined, reviewerId);
      },

      moveToUnassigned: (taskId, reason) => {
        const { tasks, writeAudit } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'unassigned',
                  unassignedReason: reason,
                  unassignedAt: now(),
                  updatedAt: now(),
                }
              : t
          ),
        }));
        writeAudit('auto_unassign', taskId, task.title, `原因: ${reason}`);
      },

      startReview: (taskId) => {
        const { tasks, writeAudit } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status !== 'assigned') return;

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'in_review', updatedAt: now() } : t
          ),
        }));
        writeAudit('start_review', taskId, task.title);
      },

      approveTask: (taskId) => {
        const { tasks, reviewers, writeAudit } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task || !['assigned', 'in_review'].includes(task.status)) return;

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'approved', updatedAt: now() } : t
          ),
          reviewers: s.reviewers.map((r) =>
            r.id === task.assignedTo ? { ...r, wipCount: Math.max(0, r.wipCount - 1) } : r
          ),
        }));
        writeAudit('approve', taskId, task.title);
      },

      rejectTask: (taskId, reason) => {
        const { tasks, reviewers, writeAudit } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task || !['assigned', 'in_review'].includes(task.status)) return;

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'rejected', updatedAt: now() } : t
          ),
          reviewers: s.reviewers.map((r) =>
            r.id === task.assignedTo ? { ...r, wipCount: Math.max(0, r.wipCount - 1) } : r
          ),
        }));
        writeAudit('reject', taskId, task.title, reason);
      },

      submitRevision: (originalTaskId, newContent) => {
        const { tasks } = get();
        const original = tasks.find((t) => t.id === originalTaskId);
        if (!original) throw new Error('Original task not found');

        const revision: ReviewTask = {
          id: genId(),
          title: original.title,
          contentType: original.contentType,
          domain: original.domain,
          authorId: original.authorId,
          authorName: original.authorName,
          status: 'pending_review',
          content: newContent,
          createdAt: now(),
          updatedAt: now(),
          revisionOf: originalTaskId,
        };

        set((s) => ({
          tasks: [
            ...s.tasks.map((t) =>
              t.id === originalTaskId ? { ...t, status: 'revision' as const, updatedAt: now() } : t
            ),
            revision,
          ],
        }));
        get().writeAudit('revision_submit', revision.id, revision.title, `修订自 ${originalTaskId}`);

        // 尝试自动分配
        get().autoAssign(revision.id);
        return revision;
      },

      reassignTask: (taskId, newReviewerId, forceReason) => {
        const { tasks, reviewers, currentUserId, writeAudit } = get();
        const task = tasks.find((t) => t.id === taskId);
        const newReviewer = reviewers.find((r) => r.id === newReviewerId);
        const currentUser = reviewers.find((r) => r.id === currentUserId);
        if (!task || !newReviewer) return;

        // 权限校验
        const currentRole = currentUser?.role ?? 'admin';
        if (task.status === 'in_review' && currentRole !== 'admin') {
          console.warn('只有 admin 可以改派审核中的任务');
          return;
        }
        if (currentRole === 'reviewer') {
          console.warn('reviewer 不可改派');
          return;
        }

        if (newReviewer.wipCount >= WIP_LIMIT) {
          console.warn('目标审核员已满载');
          return;
        }

        const oldReviewerId = task.assignedTo;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  assignedTo: newReviewerId,
                  assignedAt: now(),
                  slaDeadline: slaDeadline(),
                  updatedAt: now(),
                }
              : t
          ),
          reviewers: s.reviewers.map((r) => {
            if (r.id === newReviewerId)
              return { ...r, wipCount: r.wipCount + 1, lastAssignedAt: now() };
            if (r.id === oldReviewerId)
              return { ...r, wipCount: Math.max(0, r.wipCount - 1) };
            return r;
          }),
        }));
        writeAudit('reassign', taskId, task.title, forceReason, newReviewerId);
      },

      // ----- 审核员操作 -----
      addReviewer: (data) => {
        const reviewer: Reviewer = {
          ...data,
          id: genId(),
          wipCount: 0,
          isPaused: false,
        };
        set((s) => ({ reviewers: [...s.reviewers, reviewer] }));
      },

      pauseReviewer: (reviewerId) => {
        const { reviewers, writeAudit } = get();
        const reviewer = reviewers.find((r) => r.id === reviewerId);
        if (!reviewer) return;
        set((s) => ({
          reviewers: s.reviewers.map((r) =>
            r.id === reviewerId ? { ...r, isPaused: true } : r
          ),
        }));
        writeAudit('pause_reviewer', undefined, undefined, undefined, reviewerId);
      },

      resumeReviewer: (reviewerId) => {
        const { reviewers, writeAudit } = get();
        const reviewer = reviewers.find((r) => r.id === reviewerId);
        if (!reviewer) return;
        set((s) => ({
          reviewers: s.reviewers.map((r) =>
            r.id === reviewerId ? { ...r, isPaused: false } : r
          ),
        }));
        writeAudit('resume_reviewer', undefined, undefined, undefined, reviewerId);
      },
    }),
    {
      name: 'pangen-review-store',
    }
  )
);
