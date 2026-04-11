# Tasks: 校园站前端重建

**Input**: Design documents from `/specs/012-campus-rebuild/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 手动验证（原型阶段无自动化测试框架），验证步骤见 quickstart.md 6-Step Verification

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 校园站项目初始化和基础结构

- [ ] T001 在 `NorthStar/pangen-ai-compass/` 根目录创建 `campus.html` 校园站独立入口文件，引入 React 挂载点 `<div id="root">`
- [ ] T002 [P] 修改 `NorthStar/pangen-ai-compass/vite.config.ts`，在 `rollupOptions.input` 中添加 `campus: resolve(__dirname, 'campus.html')` 多页构建配置，保留智谱 AI proxy `/__zhipu`
- [ ] T003 [P] 创建 `NorthStar/pangen-ai-compass/src/campus/constants.ts`，定义 8 个校园分类（arrival/food/shopping/transport/admin/activity/secondhand/pitfalls），每个包含 slug、name、icon（lucide-react）、color、description、sortOrder、enabled 字段

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 校园站核心基础设施，所有 User Story 的前置依赖

**⚠️ CRITICAL**: 以下任务完成前，无法开始任何 User Story

- [ ] T004 创建 `NorthStar/pangen-ai-compass/src/campus/store.ts`，使用 Zustand 5 + persist middleware，定义 CampusState 接口（articles、topics、initialized），实现 initialize() 幂等初始化方法
- [ ] T005 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中添加 searchArticles(query) 方法，搜索范围覆盖标题+摘要+内容
- [ ] T006 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中添加 getTopics()、getTopicsByCategory(slug)、getArticlesByTopic(id)、getTopicById(id) 查询方法
- [ ] T007 [P] 创建 `NorthStar/pangen-ai-compass/src/campus/routes.tsx`，使用 React Router v7 BrowserRouter 定义校园站路由：`/` → CampusHomePage，`/category/:slug` → CategoryPage，`/article/:id` → CampusArticlePage
- [ ] T008 [P] 创建 `NorthStar/pangen-ai-compass/src/campus/CampusApp.tsx`，实现应用壳组件（独立 Header + 路由容器 + Footer），Header 包含站名"北星校园"和"跳转全球站"链接（target="_blank"），Footer 包含版权信息

**Checkpoint**: 校园站基础架构就绪 — store 可读写、路由可导航、应用壳可渲染

---

## Phase 3: User Story 1 - 校园站独立首页 (Priority: P1) 🎯 MVP

**Goal**: 用户访问 `/campus.html` 看到与全球站布局一致但内容完全不同的校园站首页

**Independent Test**: 打开 `http://localhost:3000/campus.html`，确认显示校园站首页（分类入口+专题卡片+热门文章），非全球站内容

### Implementation for User Story 1

- [ ] T009 [US1] 创建 `NorthStar/pangen-ai-compass/src/campus/pages/CampusHomePage.tsx`，实现首页布局：Hero 区域（"你的校园生活指南"标题）+ 本地搜索框 + 分类入口网格（8 个分类卡片）+ 专题推荐区 + 热门文章列表
- [ ] T010 [US1] 在 `NorthStar/pangen-ai-compass/src/campus/pages/CampusHomePage.tsx` 中实现本地搜索功能，使用 useMemo + store.searchArticles() 对标题和摘要进行实时过滤，输入框防抖 300ms
- [ ] T011 [US1] 在 `NorthStar/pangen-ai-compass/src/campus/pages/CampusHomePage.tsx` 中实现热门文章列表，从 store 获取 articles 按 views 降序排列，使用 ArticleCard 组件渲染
- [ ] T012 [US1] 在 `NorthStar/pangen-ai-compass/src/campus/pages/CampusHomePage.tsx` 中实现专题推荐区，从 store 获取 topics，使用 TopicCard 组件渲染，点击跳转 `/category/:slug`

**Checkpoint**: 校园站首页完整可用 — Hero、搜索、分类入口、专题、热门文章均可正常交互

---

## Phase 4: User Story 2 - 校园站 AI 搜索 (Priority: P1)

**Goal**: 校园站 AI 搜索使用"校园生活顾问"角色，回答校园生活问题并推荐校园站文章

**Independent Test**: 在 AI 搜索框输入"学校附近有什么好吃的"，搜索结果包含校园站文章推荐，系统提示为"校园生活顾问"角色

### Implementation for User Story 2

- [ ] T013 [P] [US2] 创建 `NorthStar/pangen-ai-compass/src/campus/services/campusAIService.ts`，封装智谱 GLM-4-Flash 调用逻辑，系统提示为"校园生活顾问"角色，tool calling 使用 `emit_campus_result` 函数返回推荐文章列表
- [ ] T014 [US2] 创建 `NorthStar/pangen-ai-compass/src/campus/components/CampusAISearch.tsx`，实现 AI 搜索交互组件：搜索输入框 + 加载动画 + AI 回答区域 + 推荐文章卡片列表
- [ ] T015 [US2] 在 `NorthStar/pangen-ai-compass/src/campus/components/CampusAISearch.tsx` 中实现 AI 失败降级逻辑：当 API 调用超时或失败时，自动回退到 store.searchArticles() 关键词搜索

**Checkpoint**: 校园站 AI 搜索完整可用 — 可正常对话、返回推荐、失败降级

---

## Phase 5: User Story 3 - 种子内容填充 (Priority: P1)

**Goal**: 8 个校园分类各有足够种子文章（≥ 10 篇目标）和专题（各 1 个），用户浏览时有内容可消费

**Independent Test**: 浏览每个分类页面，确认文章列表非空；总文章数 ≥ 67 篇

### Implementation for User Story 3

- [ ] T016 [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 的种子数据中填充 arrival（新生报到）分类：10 篇文章 + topic-arrival 专题，每篇文章包含 id（campus-a{n}）、title、summary、content（Markdown）、coverImage（picsum 占位）、views、likes、publishedAt
- [ ] T017 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 food（吃）分类：10 篇文章 + topic-food 专题
- [ ] T018 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 admin（办事）分类：11 篇文章 + topic-admin 专题
- [ ] T019 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 pitfalls（避坑）分类：9 篇文章 + topic-pitfalls 专题
- [ ] T020 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 activity（活动）分类：7 篇文章 + topic-activity 专题
- [ ] T021 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 shopping（买）分类：8 篇文章 + topic-save 专题（跨分类）
- [ ] T022 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 secondhand（二手）分类：7 篇文章 + topic-secondhand 专题
- [ ] T023 [P] [US3] 在 `NorthStar/pangen-ai-compass/src/campus/store.ts` 中填充 transport（出行）分类：5 篇文章 + topic-transport 专题
- [ ] T024 [US3] 修复 `NorthStar/pangen-ai-compass/src/campus/store.ts` 种子数据中的 2 个重复文章 ID（campus-b4、campus-b13），确保所有 ID 唯一

**Checkpoint**: 种子数据完整 — 67 篇文章覆盖 8 个分类、8 个专题，所有 ID 唯一

---

## Phase 6: Category Page + Article Page (Cross-Story Pages)

**Purpose**: 分类浏览页和文章阅读页，支撑 US1 的浏览闭环

- [ ] T025 创建 `NorthStar/pangen-ai-compass/src/campus/pages/CategoryPage.tsx`，实现分类详情页：专题卡片列表 + 文章列表 + 排序切换（最新/最热），通过 URL 参数 `:slug` 从 store 获取对应分类数据
- [ ] T026 [P] 创建 `NorthStar/pangen-ai-compass/src/campus/pages/CampusArticlePage.tsx`，实现文章阅读页：三栏桌面布局（目录栏 w-72 + 正文栏 + 推荐栏 w-64），移动端两栏（正文 + 侧滑目录抽屉），使用 react-markdown 渲染正文
- [ ] T027 在 `NorthStar/pangen-ai-compass/src/campus/pages/CategoryPage.tsx` 中确保排序按钮触控区域 ≥ 44px（py-2），符合宪法原则五移动端底线

**Checkpoint**: 分类页 + 文章页完整可用，从首页到分类到文章的浏览闭环打通

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨 User Story 的收尾工作

- [ ] T028 验证校园站布局与全球站一致性：ArticleCard 使用横向 flex-row 布局、TopicCard 高度 h-48 + 渐变遮罩、搜索框 rounded-2xl 圆角样式
- [ ] T029 [P] 验证移动端适配：所有交互元素触控区域 ≥ 44px，文章页移动端目录抽屉正常工作
- [ ] T030 [P] 验证全球站回归：访问 `/` 确认全球站无报错、功能正常，确认校园站代码未影响全球站
- [ ] T031 修复分类内容不足时的 Locked 态展示：transport(5)、secondhand(7)、shopping(8) 未达 10 篇目标，按宪法原则六展示 Locked 状态
- [ ] T032 执行 quickstart.md 6-Step Verification 全流程验证

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 — 立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 — 阻塞所有 User Story
- **User Stories (Phase 3-5)**: 均依赖 Foundational 完成
  - US1 (首页) 和 US2 (AI 搜索) 可并行开发
  - US3 (种子数据) 可与 US1/US2 并行
- **Cross-Story Pages (Phase 6)**: 依赖 US1 + US3 完成
- **Polish (Phase 7)**: 依赖所有 User Story 完成

### User Story Dependencies

- **US1 (首页)**: 依赖 Foundational → 无跨 Story 依赖
- **US2 (AI 搜索)**: 依赖 Foundational → 无跨 Story 依赖（AI 搜索独立组件）
- **US3 (种子数据)**: 依赖 Foundational → 无跨 Story 依赖（纯 store 数据填充）
- **Phase 6 (分类页+文章页)**: 依赖 US1（分类入口）+ US3（文章数据）

### Parallel Opportunities

- Phase 1: T002 和 T003 可并行（不同文件）
- Phase 2: T007 和 T008 可并行（不同文件）
- Phase 4: T13 可独立于 T014/T015 先行
- Phase 5: T016-T023 全部可并行（不同分类数据）
- Phase 6: T025 和 T026 可并行（不同文件）
- Phase 7: T029 和 T030 可并行

---

## Parallel Example: Phase 5 (Seed Content)

```bash
# 8 个分类种子数据可完全并行填充（不同数据段）：
Task T016: "arrival 分类 10 篇文章"
Task T017: "food 分类 10 篇文章"
Task T018: "admin 分类 11 篇文章"
Task T019: "pitfalls 分类 9 篇文章"
Task T020: "activity 分类 7 篇文章"
Task T021: "shopping 分类 8 篇文章"
Task T022: "secondhand 分类 7 篇文章"
Task T023: "transport 分类 5 篇文章"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → campus.html + vite.config.ts + constants.ts
2. Complete Phase 2: Foundational → store.ts + routes.tsx + CampusApp.tsx
3. Complete Phase 3: User Story 1 → CampusHomePage.tsx
4. **STOP and VALIDATE**: 访问 `/campus.html` 确认首页正常渲染
5. 可演示校园站独立入口

### Incremental Delivery

1. Setup + Foundational → 基础架构就绪
2. Add US1 (首页) → 独立验证 → 可演示
3. Add US2 (AI 搜索) → 独立验证 → 可演示
4. Add US3 (种子数据) → 独立验证 → 可演示
5. Add Phase 6 (分类页+文章页) → 浏览闭环完整
6. Add Phase 7 (Polish) → 交付就绪

### Known Gaps (Post-012)

- transport(5)、secondhand(7)、shopping(8) 未达 10 篇目标 — 需后续补充
- 3 领域重构（日常起居/成长提升/精明消费）待后续版本实施，PRD v2.0 已定义映射关系
- 重复文章 ID 需修复（campus-b4, campus-b13）
