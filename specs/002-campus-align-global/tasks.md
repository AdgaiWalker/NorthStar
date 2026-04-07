# Tasks: 国内站对齐全球站内容组织

**Input**: Design documents from `/specs/002-campus-align-global/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）
- 包含具体文件路径

## Phase 1: 数据层基础（共享基础设施）

**Purpose**: 新增 CampusTopic 类型、种子数据、Store 方法——所有用户故事的前置依赖

- [ ] T001 在 `src/campus/store.ts` 中新增 `CampusTopic` 接口定义（id, title, description, coverImage, category, articleIds[]）
- [ ] T002 在 `src/campus/store.ts` 中为 `CampusArticle` 接口新增可选字段 `topicId?: string`
- [ ] T003 在 `src/campus/store.ts` 中新增 2 个种子专题（topic-arrival: 新生报到全攻略, topic-save: 校园省钱指南），并将对应文章添加 topicId
- [ ] T004 在 `src/campus/store.ts` 的 Zustand store 中新增方法：getTopics, getTopicsByCategory, getArticlesByTopic, getTopicById

**Checkpoint**: Store 编译通过，所有新方法可在控制台调用验证

---

## Phase 2: User Story 1 — 本地搜索（P1）🎯 MVP

**Goal**: 首页添加搜索框，输入关键词实时过滤文章，清空恢复默认内容
**Independent Test**: 首页输入"食堂"→ 看到匹配文章；清空 → 恢复分类入口 + 热门内容

### Implementation for User Story 1

- [ ] T005 [P] [US1] 在 `src/campus/pages/CampusHomePage.tsx` 的 Hero 区下方添加搜索框组件（input + 搜索图标，样式参考全球站搜索框但不做 AI 搜索）
- [ ] T006 [US1] 在 `src/campus/pages/CampusHomePage.tsx` 中实现搜索状态逻辑：使用 useState 管理搜索关键词，调用 useCampusStore().searchArticles(query) 过滤文章
- [ ] T007 [US1] 在 `src/campus/pages/CampusHomePage.tsx` 中实现搜索结果展示：搜索时隐藏分类入口，显示搜索结果卡片列表 + 空状态提示"没有找到相关内容，试试其他关键词？"

**Checkpoint**: 首页搜索框可用，输入/清空/空结果三种状态正常

---

## Phase 3: User Story 2 — 专题浏览（P2）

**Goal**: 首页和分类页展示专题卡片，用户可点击进入专题内文章
**Independent Test**: 首页可见"专题推荐"区域，分类页可见该分类的专题卡片

### Implementation for User Story 2

- [ ] T008 [P] [US2] 在 `src/campus/pages/CampusHomePage.tsx` 中分类入口网格和热门内容之间，新增"专题推荐"区域，使用 useCampusStore().getTopics() 获取数据
- [ ] T009 [P] [US2] 在 `src/campus/pages/CampusHomePage.tsx` 中实现 TopicCard 组件（全宽封面图 + 渐变遮罩 + 标题 + 描述 + 文章数 badge），点击跳转到专题内第一篇文章
- [ ] T010 [US2] 在 `src/campus/pages/CategoryPage.tsx` 中面包屑和文章列表之间，新增该分类下的专题卡片区域，使用 useCampusStore().getTopicsByCategory(slug) 获取数据

**Checkpoint**: 首页专题卡片可见且可点击，分类页显示对应专题（如有）

---

## Phase 4: User Story 3 — 文章页三栏布局（P3）

**Goal**: 属于专题的文章自动切换为三栏布局（系列目录 + 正文 + TOC）
**Independent Test**: 打开专题文章 → 三栏；打开独立文章 → 两栏

### Implementation for User Story 3

- [ ] T011 [US3] 在 `src/campus/pages/CampusArticlePage.tsx` 中检测文章的 topicId，若有则获取专题信息和同专题文章列表（使用 getTopicById + getArticlesByTopic）
- [ ] T012 [US3] 在 `src/campus/pages/CampusArticlePage.tsx` 中实现左侧系列目录栏：显示专题标题 + 描述 + 文章列表（当前文章高亮），点击跳转其他文章，使用 `hidden lg:block` 响应式隐藏
- [ ] T013 [US3] 在 `src/campus/pages/CampusArticlePage.tsx` 中根据是否有 topicId 切换布局：有专题时三栏（`grid lg:grid-cols-[220px_1fr_220px]`），无专题时两栏（`flex`，保持当前布局）

**Checkpoint**: 专题文章三栏布局正常，独立文章保持两栏，系列目录点击跳转正确

---

## Phase 5: User Story 4 — 分类页排序切换（P3）

**Goal**: 分类页提供热门/最新排序切换，默认热门
**Independent Test**: 分类页切换排序标签，文章列表顺序变化

### Implementation for User Story 4

- [ ] T014 [P] [US4] 在 `src/campus/pages/CategoryPage.tsx` 中新增排序状态 `useState<'hot'|'new'>('hot')`，实现胶囊切换器 UI（热门 | 最新，当前选中态高亮）
- [ ] T015 [US4] 在 `src/campus/pages/CategoryPage.tsx` 中实现排序逻辑：hot → 按 views 降序，new → 按 publishedAt 降序，切换时重新渲染文章列表

**Checkpoint**: 排序切换器正常工作，默认热门排序

---

## Phase 6: 全局验证与收尾

**Purpose**: 双站验证，确保无交叉污染

- [ ] T016 启动校园前端 `pnpm dev:c campus`，依次验证首页搜索、专题卡片、分类页排序、文章页三栏布局（参考 quickstart.md 6 步验证流程）
- [ ] T017 [P] 启动全球前端验证所有页面功能正常，确认零回归

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (数据层)**: 无依赖，最先执行
- **Phase 2 (US1 搜索)**: 依赖 Phase 1（store 方法已就绪）
- **Phase 3 (US2 专题)**: 依赖 Phase 1（Topic 数据和方法已就绪）
- **Phase 4 (US3 三栏)**: 依赖 Phase 1（topicId 字段 + Topic 方法）
- **Phase 5 (US4 排序)**: 仅依赖 Phase 1，与 Phase 2/3/4 无关
- **Phase 6 (验证)**: 依赖所有前序 Phase 完成

### Parallel Opportunities

```
Phase 1 完成后可并行启动:
  ├─ Phase 2 (US1 搜索) — CampusHomePage.tsx
  ├─ Phase 3 (US2 专题) — CampusHomePage.tsx + CategoryPage.tsx
  ├─ Phase 4 (US3 三栏) — CampusArticlePage.tsx
  └─ Phase 5 (US4 排序) — CategoryPage.tsx
```

注意：Phase 2 和 Phase 3 都修改 CampusHomePage.tsx，实际并行时需注意文件冲突。建议顺序执行 Phase 2 → Phase 3。

### Within Each User Story

- Store 数据定义（Phase 1）先于页面组件
- 页面 UI 先于交互逻辑
- 每个 Phase 完成后独立验证

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: 数据层基础
2. 完成 Phase 2: 搜索功能
3. **验证**: 搜索框输入/清空/空结果三种状态
4. 可独立交付

### 完整交付

1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
2. 每个 Phase 完成后立即验证对应功能
3. 最终 Phase 6 双站回归验证

---

## Notes

- 所有文件路径相对于 `NorthStar/pangen-ai-compass/` 根目录
- 不修改 `constants.ts`（分类定义不变）、`routes.tsx`（路由不变）
- 不修改全球站任何文件
- [P] 标记的任务在无文件冲突时可并行开发
