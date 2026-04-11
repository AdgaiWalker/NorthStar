# Feature Specification: 校园站前端重建

**Feature Branch**: `012-campus-rebuild`
**Created**: 2026-04-10
**Status**: Draft
**Input**: product_planning.md 原型 2 + 宪法原则十一"双站架构" + PRD §2.2 校园站定义

## User Scenarios & Testing

### User Story 1 - 用户访问校园站看到独立首页 (Priority: P1)

用户访问校园站域名，看到与全球站布局一致但内容完全不同的首页：校园分类入口、校园 Hero 文案、校园 AI 搜索。

**Why this priority**: 校园站是"一半生活"的承载，没有校园站就无法验证"校园生活顾问"的价值假设。

**Independent Test**: 打开校园站 URL，看到校园站首页（分类入口 + 专题卡片 + 热门文章），非全球站内容。

**Acceptance Scenarios**:

1. **Given** 用户访问校园站 URL，**When** 页面加载完成，**Then** 展示校园站首页，包含 8 个分类入口
2. **Given** 用户在校园站首页，**When** 查看 Hero 区域，**Then** 标题体现"校园生活指南"定位
3. **Given** 用户在校园站首页，**When** 查看 Header，**Then** 看到"跳转全球站"链接（新标签页打开）

---

### User Story 2 - 校园站 AI 搜索回答校园生活问题 (Priority: P1)

用户在校园站输入校园生活问题（如"学校附近有什么好吃的"），AI 搜索返回本地化推荐内容。

**Why this priority**: 校园站 AI 搜索是核心差异功能，系统提示必须切换为"校园生活顾问"。

**Independent Test**: 输入"学校附近有什么好吃的"，搜索结果包含校园站文章推荐。

**Acceptance Scenarios**:

1. **Given** 用户在校园站 AI 搜索输入校园生活问题，**When** 搜索完成，**Then** 系统使用"校园生活顾问"角色回答
2. **Given** AI 搜索返回结果，**When** 结果包含推荐文章，**Then** 推荐内容来自校园站内容库

---

### User Story 3 - 校园站有足够种子内容可用 (Priority: P1)

每个校园领域至少有 10 篇文章和 3 个专题，用户浏览时有内容可看。

**Why this priority**: 宪法原则四"冷启动诚实策略"要求每个领域至少 10 篇内容才开放。

**Independent Test**: 浏览每个领域，看到内容卡片数量 ≥ 10 篇文章。

**Acceptance Scenarios**:

1. **Given** 用户切换到"日常起居"领域，**When** 查看热门推荐，**Then** 展示 ≥ 10 篇文章卡片
2. **Given** 用户切换到"成长提升"领域，**When** 查看专题系列，**Then** 展示 ≥ 3 个专题卡片
3. **Given** 用户切换到"精明消费"领域，**When** 查看内容，**Then** 展示 ≥ 10 篇文章卡片

---

### Edge Cases

- 校园站和全球站共享同一套代码但使用不同入口，代码改动需同时验证两站
- 校园站内容不足时，应展示 Locked 态而非空白（遵循宪法原则六）
- 两站之间的跳转不传递登录态（宪法原则十一）

## Requirements

### Functional Requirements

- **FR-001**: 校园站必须通过独立入口访问，与全球站使用同一套前端代码
- **FR-002**: 校园站使用 8 个分类（arrival/food/shopping/transport/admin/activity/secondhand/pitfalls）组织内容；3 领域重构（daily/growth/deal）待后续版本实施
- **FR-003**: 校园站 Hero 文案必须体现"校园生活指南"定位
- **FR-004**: 校园站 AI 搜索系统提示必须为"校园生活顾问"角色
- **FR-005**: 校园站内容必须按校园领域组织（非全球站领域）
- **FR-006**: 每个校园分类必须有 ≥ 5 篇种子文章和 ≥ 1 个种子专题（达标线 10 篇，未达标展示 Locked 态）
- **FR-007**: 校园站 Header 必须提供"跳转全球站"链接
- **FR-008**: 校园站与全球站布局和交互必须完全一致（遵循宪法原则十一功能对称表）

### Key Entities

- **CampusDomain**: 校园领域（slug、名称、图标、颜色、描述）
- **CampusTopic**: 校园专题（标题、描述、封面、所属领域、包含文章）
- **CampusArticle**: 校园文章（标题、摘要、正文、封面、所属领域、专题归属）

## Success Criteria

### Measurable Outcomes

- **SC-001**: 校园站首页布局与全球站 100% 一致（Hero + 搜索 + 领域切换 + 内容网格）
- **SC-002**: 校园站 8 个分类共有 ≥ 60 篇种子文章，用户浏览时有内容可消费
- **SC-003**: 校园站 AI 搜索使用"校园生活顾问"角色，100% 不使用"AI 软件顾问"
- **SC-004**: 校园站与全球站可互相跳转，跳转不传递登录态

## Assumptions

- 校园站使用共享前端代码，通过入口文件和配置变量区分站点
- 种子内容使用 AI 辅助生成，由内容团队审校
- 校园站 AI 搜索使用相同的模型服务，仅系统提示不同
- 校园站登录方式为手机号（后端 MVP 阶段可能使用模拟验证码）
