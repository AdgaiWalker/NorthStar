# Spec-审核工作台-任务模型与自动分配

版本：v0.1
日期：2025-12-23
状态：生效

## 1. 目标与范围
本规格定义「系统后台-审核工作台（Review Workbench）」在 V1 前端演示版中的实现标准。

本规格覆盖的能力包含：
- 审核任务模型（ReviewTask）与状态机
- 审核员模型（Reviewer）与角色权限
- 自动分配（WIP=10、SLA=48h、修订优先同人）
- 待分配池（unassigned）与原因枚举
- 改派（reassign）与强制原因
- 审计日志（AuditLog）记录范围与字段
- 前端页面与交互闭环（队列/详情/待分配池/审核员/审计）

本规格不覆盖的能力包含：
- 与真实后端鉴权/数据库的集成
- 内容库（文章/工具）真实投稿与发布流程
- 运营后台（内容管理、认证审核、次数与收费、AI 引擎配置等）

## 2. 术语与通俗解释
- ReviewTask（审核任务）：一条需要审核的内容（文章/工具推荐/视频文档），包含正文与审核状态。
- Reviewer（审核员）：处理审核任务的人，有角色与可审领域。
- WIP（Work In Progress）：在手任务数。WIP=10 表示同一审核员同时处理的任务最多为 10。
- SLA（Service Level Agreement）：服务时限。SLA=48h 表示任务分配后 48 小时内完成审核。
- persist（持久化）：把状态存到浏览器 localStorage，刷新后仍能保留。
- unassigned（待分配池）：系统找不到合适审核员时，任务进入该池等待处理。

## 3. 数据模型（对齐代码实现）
### 3.1 ReviewTaskStatus（状态枚举）
状态枚举必须包含：
- pending_review：待审核/待分配
- assigned：已分配，待开始
- in_review：审核中
- approved：已通过
- rejected：已退回
- revision：作者修订中
- unassigned：进入待分配池

代码对应：`pangen-ai-compass/src/types/review.ts`。

### 3.2 ReviewTask（审核任务）字段
ReviewTask 字段必须包含：
- id：string，唯一标识
- title：string，标题
- contentType：'article' | 'tool' | 'video_doc'
- domain：'dev' | 'creative' | 'work'
- authorId：string
- authorName：string
- status：ReviewTaskStatus
- content：string（Markdown）
- createdAt：number（ms 时间戳）
- updatedAt：number（ms 时间戳）

可选字段必须包含：
- assignedTo：string（审核员 ID）
- assignedAt：number（分配时间戳）
- slaDeadline：number（分配后 48h 的截止时间戳）
- revisionOf：string（若为修订任务，指向原任务 ID）
- unassignedReason：UnassignedReason
- unassignedAt：number

代码对应：`pangen-ai-compass/src/types/review.ts`。

### 3.3 UnassignedReason（待分配原因枚举）
原因枚举必须包含：
- no_reviewer_available：无可用审核员（兜底原因）
- all_reviewers_over_capacity：审核员已满载
- no_reviewer_for_domain：无该领域审核员
- policy_blocked：策略阻止（预留）

原因中文展示必须存在，并在 UI 中可见。

代码对应：
- 枚举定义：`pangen-ai-compass/src/types/review.ts`
- UI 映射：`pangen-ai-compass/src/pages/admin/UnassignedPoolPage.tsx`

### 3.4 ReviewerRole（角色枚举）
角色枚举必须包含：
- reviewer：审核员（只审，不改派）
- editor：编辑（可改派 assigned 任务）
- admin：管理员（可强制改派 in_review，必须填原因）

代码对应：`pangen-ai-compass/src/types/review.ts`。

### 3.5 Reviewer（审核员）字段
Reviewer 字段必须包含：
- id：string
- name：string
- role：ReviewerRole
- domains：('dev' | 'creative' | 'work')[]
- isPaused：boolean（是否暂停接单）
- wipCount：number（当前在手任务数）

可选字段必须包含：
- lastAssignedAt：number（用于轮转的上次分配时间）

代码对应：`pangen-ai-compass/src/types/review.ts`。

### 3.6 审计日志（AuditLog）字段
AuditLog 字段必须包含：
- id：string
- timestamp：number（ms 时间戳）
- action：AuditAction
- operatorId：string
- operatorName：string

可选字段必须包含：
- taskId：string
- taskTitle：string
- targetId：string（例如改派目标审核员 ID）
- note：string（原因/备注）

代码对应：`pangen-ai-compass/src/types/review.ts`。

## 4. 状态持久化（V1 前端演示版）
审核工作台必须使用浏览器本地存储持久化状态。

实现规则必须与代码一致：
- 使用 zustand persist 中间件
- localStorage key 必须为：`pangen-review-store`
- 存储内容必须覆盖：tasks、reviewers、auditLogs、currentUserId、currentUserName

代码对应：`pangen-ai-compass/src/store/useReviewStore.ts`。

## 5. 自动分配（Auto Assign）
### 5.1 触发时机
自动分配必须在以下时机触发：
- submitTask 创建新任务后立即触发
- submitRevision 创建修订任务后立即触发
- approve/reject 释放容量后触发（从待分配池尝试取一条）
- resumeReviewer 恢复接单后触发（从待分配池尝试取一条）

代码对应：`pangen-ai-compass/src/store/useReviewStore.ts`。

### 5.2 候选池过滤规则
候选审核员必须满足以下条件：
- isPaused=false
- domains 包含 task.domain
- wipCount < WIP_LIMIT

WIP_LIMIT 必须固定为 10。

### 5.3 修订优先同人
当任务为修订任务（revisionOf 存在）时：
- 系统必须尝试将任务优先分配给原任务的 assignedTo
- 原审核员不在候选池时，系统必须按通用策略选择

### 5.4 选择策略（轮转）
系统必须按以下优先级选择候选审核员：
1) 若存在 preferredReviewerId 且在候选池中，系统选择该审核员
2) 否则系统按以下排序选择第一名：
   - wipCount 升序（在手任务少的优先）
   - lastAssignedAt 升序（更久未被分配的优先）

### 5.5 SLA 规则
系统必须在任务分配时写入 slaDeadline：
- slaDeadline = assignedAt + SLA_HOURS（48 小时）

SLA_HOURS 必须固定为 48。

## 6. 待分配池（Unassigned Pool）
### 6.1 进入条件
当 autoAssign 找不到候选审核员时，任务必须进入待分配池：
- status 置为 unassigned
- 写入 unassignedReason
- 写入 unassignedAt

原因选择规则必须与实现一致：
- 若存在任意 reviewer 的 domains 命中 task.domain，则 reason=all_reviewers_over_capacity
- 否则 reason=no_reviewer_for_domain

系统必须写入审计日志 action=auto_unassign。

### 6.2 自动恢复
系统必须在以下时机尝试自动恢复：
- approve/reject 减少 wipCount 后
- resumeReviewer 恢复接单后

恢复策略必须与实现一致：
- 每次只尝试从待分配池取一条任务进行 autoAssign

## 7. 手动分配（Manual Assign）
### 7.1 入口
管理员必须可在“待分配池”页面手动分配任务。

页面对应：`/admin/unassigned`。

### 7.2 规则
手动分配必须满足：
- 审核员未暂停（isPaused=false）
- 审核员领域匹配（domains 包含 task.domain）
- 审核员未满载（wipCount < WIP_LIMIT）

手动分配成功后必须：
- 任务状态置为 assigned
- 写入 assignedTo、assignedAt、slaDeadline
- 清理 unassignedReason、unassignedAt
- 审核员 wipCount + 1，lastAssignedAt 更新
- 写入审计日志 action=assign

代码对应：
- 业务逻辑：`pangen-ai-compass/src/store/useReviewStore.ts` 的 `assignTask`
- UI：`pangen-ai-compass/src/pages/admin/UnassignedPoolPage.tsx`

## 8. 改派（Reassign）与权限
### 8.1 权限规则
权限必须满足：
- reviewer：不可改派
- editor：admin：可改派 assigned 状态任务
- 仅 admin：可改派 in_review 状态任务

### 8.2 强制改派原因
当任务状态为 in_review 时：
- 强制改派原因 forceReason 必须必填
- 系统必须拒绝空原因的改派请求

### 8.3 改派后效果
改派成功后必须：
- 更新任务 assignedTo、assignedAt、slaDeadline、updatedAt
- 更新审核员 wipCount：新审核员 +1，旧审核员 -1（不小于 0）
- 写入审计日志 action=reassign，并写入 note=forceReason

代码对应：
- 权限工具：`pangen-ai-compass/src/utils/reviewPermissions.ts`
- 改派逻辑：`pangen-ai-compass/src/store/useReviewStore.ts` 的 `reassignTask`
- 队列入口：`pangen-ai-compass/src/pages/admin/ReviewQueuePage.tsx`
- 详情页面板：`pangen-ai-compass/src/pages/admin/ReviewDetailPage.tsx`

## 9. 审核动作（开始/通过/退回/修订）
### 9.1 开始审核
- 前置条件：任务状态为 assigned
- 动作：startReview
- 结果：状态变为 in_review
- 审计：start_review

### 9.2 批准与退回
批准/退回必须满足：
- 前置条件：任务状态为 assigned 或 in_review
- 批准：状态变为 approved
- 退回：状态变为 rejected，并记录退回原因（reason 文本）
- wipCount：对应审核员 -1
- 审计：approve/reject
- 后续：触发 tryAssignFromUnassigned（尝试分配待分配池任务）

### 9.3 提交修订（Revision）
当生成修订任务时必须满足：
- 原任务状态置为 revision
- 新任务 status=pending_review
- 新任务 revisionOf 指向原任务 id
- 审计：revision_submit
- 后续：对新任务触发 autoAssign

代码对应：`pangen-ai-compass/src/store/useReviewStore.ts` 的 `submitRevision`。

## 10. 页面与路由
审核工作台的页面必须存在并可访问：
- `/admin/review-queue`：审核队列
- `/admin/review/:taskId`：审核详情
- `/admin/unassigned`：待分配池
- `/admin/reviewers`：审核员管理
- `/admin/audit`：审计日志

路由对应：`pangen-ai-compass/src/routes.tsx`。

## 11. 验收标准
本规格的验收标准必须满足：
- submitTask 后自动分配行为符合 WIP=10、领域匹配、轮转规则
- 候选为空时任务进入待分配池并展示明确原因
- 手动分配仅允许领域匹配且未满载的审核员
- editor/admin 可改派 assigned；in_review 仅 admin 可改派且必须填写原因
- approve/reject 正确释放 wipCount，并触发待分配池的自动恢复尝试
- 审计日志可追溯关键动作（提交、分配、改派、开始审核、通过、退回、修订提交、暂停/恢复接单、待分配池流转）

## 12. 后续演进
后续版本将按以下顺序演进：
- 接入后端鉴权与真实用户体系，将 currentUserId 与真实登录态绑定
- 将 ReviewStore 从 localStorage 迁移到数据库，并保留审计链
- 引入超时策略（SLA 超时提醒、自动升级到管理员）
- 引入内容差异 Diff 与更细粒度的 revision 管理
- 引入运营后台的内容管理与审核发布流水线
