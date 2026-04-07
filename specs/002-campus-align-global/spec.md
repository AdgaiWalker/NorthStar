# Feature Specification: 国内站对齐全球站内容组织

**Feature Branch**: `002-campus-align-global`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "对齐全球站"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 本地搜索（Campus Site Search） (Priority: P1)

作为校园站用户，我在首页输入关键词后，系统即时过滤出匹配的文章，让我快速找到需要的内容。

**Why this priority**: 搜索是内容发现的核心能力，没有搜索用户只能浏览，无法定向查找。

**Independent Test**: 在首页搜索框输入关键词，验证结果列表只包含匹配文章；清空搜索恢复默认内容。

**Acceptance Scenarios**:

1. **Given** 用户在首页，**When** 在搜索框输入"食堂"，**Then** 显示标题或摘要包含"食堂"的文章卡片列表，隐藏分类入口和热门内容
2. **Given** 用户在搜索框有输入内容，**When** 清空搜索框，**Then** 恢复显示分类入口网格 + 热门内容
3. **Given** 用户输入了一个不匹配任何文章的关键词，**When** 搜索执行，**Then** 显示"没有找到相关内容"的空状态提示

---

### User Story 2 - 专题浏览（Topic Discovery） (Priority: P2)

作为校园站用户，我在首页和分类页可以看到专题卡片（如"新生报到全攻略"），点击后查看专题内的文章列表，方便按主题系统阅读。

**Why this priority**: 专题是三级内容结构的核心，是两站对齐的关键差异化能力。P2 因为依赖数据层（Topic 类型）先就位。

**Independent Test**: 在首页看到专题卡片区域，点击进入专题内的文章。

**Acceptance Scenarios**:

1. **Given** 首页加载完成，**When** 用户浏览到分类入口下方，**Then** 可见"专题推荐"区域，展示 TopicCard 卡片（封面图 + 标题 + 描述 + 文章数）
2. **Given** 用户进入某分类页（如"吃"），**When** 该分类下存在专题，**Then** 在文章列表上方显示该分类的专题卡片
3. **Given** 用户浏览一篇属于专题的文章，**When** 页面加载完成，**Then** 左侧栏显示系列目录（同专题其他文章），当前文章高亮

---

### User Story 3 - 文章页三栏布局（Series Article Reading） (Priority: P3)

作为校园站用户，当我阅读属于某个专题的文章时，左侧显示同专题其他文章的目录，方便我连续阅读系列内容，不需要返回列表页。

**Why this priority**: 三栏布局提升系列文章的阅读体验，是对齐全球站视觉品质的关键升级。P3 因为依赖专题数据。

**Independent Test**: 打开一篇属于专题的文章，验证左侧系列目录存在；打开独立文章，验证左侧无系列目录（保持两栏）。

**Acceptance Scenarios**:

1. **Given** 用户打开一篇属于专题的文章，**When** 页面渲染完成，**Then** 显示三栏布局：系列目录（左）+ 正文（中）+ TOC 目录（右）
2. **Given** 用户打开一篇独立文章（无专题），**When** 页面渲染完成，**Then** 显示两栏布局：正文（左/中）+ TOC 目录（右）
3. **Given** 三栏布局下的系列目录，**When** 用户点击另一篇文章标题，**Then** 跳转到该文章页面，系列目录中新高亮当前文章

---

### User Story 4 - 分类页排序切换（Category Sorting） (Priority: P3)

作为校园站用户，我在分类页可以切换"热门"和"最新"排序，快速找到热门或新发布的内容。

**Why this priority**: 排序是基础的内容浏览增强，P3 因为是独立于专题的渐进优化。

**Independent Test**: 进入分类页，切换排序标签，验证文章列表顺序变化。

**Acceptance Scenarios**:

1. **Given** 用户进入某分类页，**When** 点击"热门"标签，**Then** 文章列表按浏览量从高到低排列
2. **Given** 用户进入某分类页，**When** 点击"最新"标签，**Then** 文章列表按发布时间从新到旧排列
3. **Given** 当前选中"热门"，**When** 页面初次加载，**Then** 默认显示"热门"排序

---

### Edge Cases

- 搜索结果为空时，显示友好提示文案（如"没有找到相关内容，试试其他关键词？"）
- 专题包含 0 篇文章时，不显示该专题卡片
- 文章同时属于某专题但专题已被删除，按独立文章处理（两栏布局）
- 分类下无任何专题时，分类页直接显示文章列表，不显示空白专题区域
- 文章正文无标题结构时，TOC 目录栏显示"本文暂无目录"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 首页 MUST 提供搜索框，支持按关键词实时过滤文章（标题 + 摘要匹配）
- **FR-002**: 搜索 MUST 为纯前端本地过滤，不依赖后端或 AI
- **FR-003**: 系统 MUST 支持专题（Topic）内容容器，每个专题包含标题、描述、封面图、所属分类、文章列表
- **FR-004**: 首页 MUST 在分类入口下方展示专题推荐卡片区域
- **FR-005**: 分类页 MUST 展示该分类下的专题卡片（如有）和文章列表
- **FR-006**: 分类页 MUST 提供排序切换器（热门/最新），默认热门
- **FR-007**: 属于专题的文章 MUST 在文章页展示三栏布局（系列目录 + 正文 + TOC）
- **FR-008**: 独立文章 MUST 保持两栏布局（正文 + TOC）
- **FR-009**: 系列目录 MUST 高亮当前文章，点击可切换到同专题其他文章
- **FR-010**: 全球站（xyzidea.com）MUST NOT 受任何影响——两站完全隔离

### Key Entities

- **CampusTopic（专题）**: 跨文章的内容容器，包含标题、描述、封面图、所属分类、关联文章 ID 列表。对标全球站的 Topic。
- **CampusArticle（文章）**: 最小内容单元，包含 `id`、`title`、`summary`、`content`、`coverImage`、`category`、`visibility`（`'public' | 'campus'`）、`schoolId`（campus 可见性时必填）、`views`、`likes`、`publishedAt`、`createdAt`、`updatedAt`、`topicId`（可选，表示所属专题）。无 topicId 的文章为独立文章。
- **CampusCategoryDef（分类定义）**: 分类元数据，包含 `slug`、`name`、`icon`、`color`、`description`、`sortOrder`（排序权重）、`enabled`（是否在 UI 中展示）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户在首页输入关键词后，1 秒内看到搜索结果（纯前端过滤无网络延迟）
- **SC-002**: 首页、分类页、文章页的视觉品质与全球站保持同一水准（卡片动效、渐变、阴影一致）
- **SC-003**: 属于专题的文章页自动切换为三栏布局，独立文章保持两栏——用户无需手动操作
- **SC-004**: 全球站所有页面功能和行为不受影响，零回归

## Assumptions

- 搜索仅限于前端本地过滤，使用已有的 `searchArticles` 方法，不涉及 AI 或后端搜索
- 专题数据以种子数据形式硬编码在前端 store 中（原型阶段），后续接入后端 API
- 每篇文章最多属于一个专题（一对一关系），不支持跨专题
- 首页搜索框样式参考全球站搜索框但不做 AI 搜索，仅本地过滤
- 校园站内容为纯内容消费，无用户登录体系（V1），搜索无需登录态
- 全球站不做任何改动，两站共享代码修改需同时在两站验证
