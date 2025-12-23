# Spec-后台AI助手-交互与审计

版本：v0.1
日期：2025-12-23
状态：生效

## 1. 目标与范围
本规格定义「系统后台-审核详情页 AI 助手」在 V1 前端演示版中的交互与审计标准。

本规格覆盖的能力包含：
- AI 助手入口与布局（审核详情页右侧侧栏）
- P0 按钮集合与输出形式
- AI 输出的“应用动作”（填入表单/创建修订任务）
- AI 相关审计日志（ai_run/ai_apply）

本规格不覆盖的能力包含：
- 与真实模型服务的生产级集成（Key 管理、用量记录、成本治理）
- Diff 预览与一键回滚（rollback）完整闭环
- 增强上下文选择（page_only/enhanced）与成本闸门

## 2. 术语与通俗解释
- AI 助手：在审核详情页提供的“辅助审核工具”，用于生成摘要、退回理由、修订草稿与风险提示。
- Diff：差异对比。把“原文”和“修改后内容”对照显示，便于审阅。
- 审计日志：把关键操作记录下来，便于追溯是谁在什么时间做了什么操作。
- 修订任务（revision）：当内容需要作者修改时，系统生成一条新的审核任务，表示“这是对上一版的修订稿”。

## 3. 入口与页面范围
AI 助手必须只出现在以下页面：
- 审核详情页：`/admin/review/:taskId`

代码对应：`pangen-ai-compass/src/pages/admin/ReviewDetailPage.tsx`。

AI 助手入口必须为按钮：
- 文案：`AI 助手`
- 行为：点击后打开/关闭右侧侧栏

## 4. P0 按钮集合（对齐当前实现）
AI 助手侧栏必须提供以下按钮：
- 一键摘要（summary）
- 生成退回理由（reject）
- 生成修订版本（revision）
- 风险扫描（risk）

每次点击按钮后，系统必须显示加载态：
- 文案：`AI 处理中…`
- 图标：loading spinner

## 5. 输出形式
### 5.1 输出展示
AI 输出必须展示在侧栏的“AI 输出”区域内：
- 必须以文本块展示
- 必须支持换行显示（whitespace-pre-wrap）
- 必须可滚动（max-height + overflow-y）

### 5.2 输出类型
AI 输出必须携带 type 标记：
- summary | reject | revision | risk

该 type 必须决定后续是否提供“应用”按钮。

## 6. 应用动作（AI Apply）
### 6.1 退回理由填入（reject → textarea）
当输出类型为 reject 时：
- 系统必须展示按钮：`填入退回理由`
- 点击后必须将 AI 输出全文写入“退回理由”文本框（rejectReason）
- 系统必须写入审计日志 action=ai_apply，note 必须为“填入退回理由”

### 6.2 创建修订版本（revision → submitRevision）
当输出类型为 revision 时：
- 系统必须展示按钮：`创建修订版本`
- 点击后必须创建 revision 任务：
  - 调用 submitRevision(originalTaskId, newContent)
  - newContent 必须为 AI 输出全文
- 系统必须写入审计日志 action=ai_apply，note 必须为“创建修订版本”
- 系统必须跳转回审核队列页（便于继续处理其他任务）

说明：
- revision 任务创建属于“进入队列的内容变更”，系统必须可追溯。

## 7. 审计日志规范
### 7.1 ai_run
每次运行 AI 按钮时系统必须写入：
- action：ai_run
- taskId、taskTitle
- note：必须包含模块信息，例如 `模块: summary`、`模块: reject`

### 7.2 ai_apply
每次“应用 AI 输出”时系统必须写入：
- action：ai_apply
- taskId、taskTitle
- note：必须明确具体应用动作（填入退回理由/创建修订版本）

### 7.3 revision_submit
创建修订任务时系统必须写入：
- action：revision_submit
- note：必须包含原任务 id，例如 `修订自 <originalTaskId>`

代码对应：
- 审计写入：`pangen-ai-compass/src/store/useReviewStore.ts` 的 `writeAudit`
- 审计展示：`pangen-ai-compass/src/pages/admin/AuditLogPage.tsx`

## 8. P0 实现边界（对齐当前实现）
V1 演示版的 AI 助手必须满足：
- AI 输出使用前端 mock 生成（模拟结果），不调用真实模型服务
- mock 输出必须覆盖 4 类按钮：summary/reject/revision/risk
- mock 输出必须通过 setTimeout 模拟耗时

代码对应：`pangen-ai-compass/src/pages/admin/ReviewDetailPage.tsx` 内的 `mockAiSummary/mockRejectReason/mockRevisionContent/mockRiskScan`。

## 9. 与审核流程的关系
AI 助手的定位必须是“辅助审核”，并满足：
- AI 输出不直接触发 approve/reject
- 审核员必须明确执行 approve/reject 操作
- AI 输出必须明确标注“仅供参考，最终内容需审核员确认”

## 10. 验收标准
本规格验收必须满足：
- 审核详情页可打开 AI 助手侧栏
- 运行任意按钮后出现 loading，并在完成后展示 AI 输出
- 退回理由输出可一键填入退回理由文本框
- 修订版本输出可创建 revision 任务并回到队列页
- ai_run 与 ai_apply 行为在审计日志页可追溯

## 11. 后续演进
后续版本将按以下顺序演进：
- 接入真实 AI 调用（复用用户侧 AIService 的稳定解析与 fallback 机制）
- 增加 Diff 预览与一键应用到 content（仅 editor/admin）
- 增加 ai_rollback 回滚按钮与回滚审计
- 增加上下文选择（page_only/enhanced）与成本提示
- 将 AI 输出模板沉淀为可配置的 Prompt 资产（受宪法约束）
