# Feature Specification: 校园站镜像全球站布局

**Feature Branch**: `003-campus-mirror-global`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "改的和全球站web功能布局一摸一样，包含分类，'吃穿住行'" + "按照领域"

## 背景

当前校园站（xyzidea.cn）和全球站（xyzidea.com）布局差异较大：
- **全球站**：Header 域切换器（影视创作/编程开发/通用办公）→ Hero + AI搜索 → 模块切换器（工具推荐/经验心得）→ 内容网格（TopicCard + ArticleCard + ToolCard）
- **校园站**：Hero + 搜索框 → 8 分类入口网格 → 专题卡片 → 热门文章卡片

用户要求：校园站布局**镜像全球站**，分类按"领域"组织（吃穿住行等），不再用场景式分类入口网格。

### 领域设计（按领域组织）

基于用户"按照领域"的要求，将校园内容重新组织为 3 个领域（对标全球站的 creative/dev/work）：

| 领域 slug | 名称 | 图标 | 描述 | 覆盖内容 |
|-----------|------|------|------|----------|
| daily | 日常起居 | Home | 吃、穿、住、行 | food, shopping, transport, arrival |
| growth | 成长提升 | TrendingUp | 学、社交、社团 | activity, admin(学业相关) |
| deal | 精明消费 | PiggyBank | 买、二手、省钱 | secondhand, pitfalls, shopping(省钱部分) |

### 全球站 vs 校园站布局对照

| 全球站元素 | 校园站对应 |
|-----------|-----------|
| Header 域切换器（影视创作/编程开发/通用办公） | Header 领域切换器（日常起居/成长提升/精明消费） |
| Hero + AI 搜索 | Hero + 本地搜索（已有） |
| 模块切换器（工具推荐/经验心得） | 模块切换器（热门推荐/专题系列） |
| ToolCard 网格 | 文章卡片网格（ArticleCard 横图卡片） |
| TopicCard（系列主题） | TopicCard（专题系列，已有） |
| ArticleCard（横排图文） | ArticleCard（横排图文，对标全球站样式） |
| ArticleReadView 三栏 | CampusArticlePage 三栏（已有） |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 领域切换浏览 (Priority: P1)

用户打开校园站首页，看到与全球站一致的 Header 领域切换器。点击 Logo 区域展开下拉菜单，切换"日常起居/成长提升/精明消费"领域。切换后首页内容自动刷新为该领域下的专题和文章。

**Why this priority**: 这是布局镜像的核心交互，决定了整个站点的导航模式。没有领域切换，后续所有功能都无法正确展示。

**Independent Test**: 打开首页 → 点击 Logo → 看到下拉菜单包含 3 个领域 → 切换领域 → 首页内容随之变化。

**Acceptance Scenarios**:

1. **Given** 用户在首页, **When** 点击 Logo 区域, **Then** 展示领域下拉菜单，包含"日常起居/成长提升/精明消费"三个选项，当前领域高亮
2. **Given** 领域下拉菜单展开, **When** 点击"成长提升", **Then** 首页内容刷新为该领域下的专题和文章，Logo 文字更新为"成长提升"
3. **Given** 用户在首页, **When** 直接输入 URL 切换领域, **Then** 页面正确显示对应领域内容
4. **Given** 用户在任意页面, **When** 切换领域, **Then** 返回首页并展示新领域内容

---

### User Story 2 - 模块切换器浏览内容 (Priority: P2)

用户在首页看到与全球站一致的模块切换器（胶囊按钮："热门推荐" | "专题系列"）。点击"热门推荐"看到当前领域下的文章卡片网格（横图样式）；点击"专题系列"看到 TopicCard 卡片。

**Why this priority**: 这是内容浏览的主交互方式，镜像全球站的核心布局差异。P1 完成后内容需要展示载体，模块切换器提供这个载体。

**Independent Test**: 首页可见模块切换器 → 点击"热门推荐"看到文章网格 → 点击"专题系列"看到专题卡片。

**Acceptance Scenarios**:

1. **Given** 用户在首页, **When** 页面加载完成, **Then** 看到模块切换器，默认选中"热门推荐"
2. **Given** 模块切换器显示, **When** 点击"专题系列", **Then** 显示当前领域下的 TopicCard 卡片列表
3. **Given** 当前领域下无专题, **When** 切换到"专题系列", **Then** 显示空状态提示
4. **Given** 用户切换领域, **When** 新领域加载完成, **Then** 模块切换器保持当前选中状态，内容自动更新

---

### User Story 3 - 文章卡片样式升级 (Priority: P3)

首页和分类页的文章卡片从当前的竖版卡片（封面图 + 标题 + 摘要 + 统计）升级为全球站 ArticleCard 样式（横排图文：左侧封面图 + 右侧标题/摘要/统计），视觉风格与全球站一致。

**Why this priority**: 视觉一致性提升，不影响核心功能但提升用户体验和品牌统一感。

**Independent Test**: 首页"热门推荐"标签下的文章卡片样式与全球站 ArticleCard 一致。

**Acceptance Scenarios**:

1. **Given** 首页热门推荐列表, **When** 查看文章卡片, **Then** 卡片为横排布局（左图右文），与全球站 ArticleCard 样式一致
2. **Given** 文章有封面图, **When** 渲染卡片, **Then** 封面图在左侧，宽40高28，圆角
3. **Given** 文章无封面图, **When** 渲染卡片, **Then** 使用默认占位图
4. **Given** 卡片列表, **When** 鼠标悬停, **Then** 卡片有 hover 效果（边框变深/微上浮）

---

### User Story 4 - 文章页三栏布局对齐全球站 (Priority: P3)

文章页三栏布局对齐全球站 ArticleReadView 样式：左侧栏从当前的小卡片样式改为全球站的全高侧边栏（w-72，sticky 定位，border-r 分隔线），整体布局风格与全球站一致。

**Why this priority**: 保持文章页阅读体验的一致性，属于视觉对齐范畴。

**Independent Test**: 打开专题文章 → 三栏布局与全球站 ArticleReadView 样式一致。

**Acceptance Scenarios**:

1. **Given** 打开属于专题的文章, **When** 桌面端查看, **Then** 左侧栏为 w-72 全高侧边栏，有 border-r 分隔线，sticky 定位
2. **Given** 三栏布局, **When** 查看中间正文区, **Then** max-w-4xl 居中，与全球站一致
3. **Given** 独立文章（无专题）, **When** 桌面端查看, **Then** 保持两栏布局（正文 + TOC）

### Edge Cases

- 用户通过旧 URL（如 `/category/food`）访问页面，需兼容重定向或 404 处理
- 切换领域时搜索关键词应清空
- 领域下无任何内容时，显示空状态提示（参考全球站"暂无内容"样式）
- 移动端领域切换器需适配（汉堡菜单或底部导航）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须提供 Header 领域切换器，包含 3 个领域：日常起居(daily)、成长提升(growth)、精明消费(deal)，样式和交互与全球站域切换器一致
- **FR-002**: 系统必须在 Store 中维护当前领域状态(currentDomain)，切换领域后首页内容自动按领域过滤
- **FR-003**: 系统必须将文章(article)和专题(topic)的 category 字段映射到新的领域分类（旧 category slug → 新领域 slug）
- **FR-004**: 系统必须提供模块切换器（热门推荐 | 专题系列），样式为胶囊按钮组，与全球站模块切换器一致
- **FR-005**: 系统必须在"热门推荐"标签下展示当前领域的文章列表，使用横排 ArticleCard 样式（左图右文）
- **FR-006**: 系统必须在"专题系列"标签下展示当前领域的 TopicCard 卡片，样式与全球站 TopicCard 一致（全高封面图 + 渐变遮罩）
- **FR-007**: 文章卡片必须包含：封面图（左侧）、分类标签、标题、摘要、阅读量/点赞数，与全球站 ArticleCard 信息结构一致
- **FR-008**: 系统必须移除当前首页的 8 分类入口网格和分类页（CategoryPage），以领域切换器替代分类导航
- **FR-009**: 文章页三栏布局必须对齐全球站 ArticleReadView 样式（左侧栏 w-72 sticky border-r）
- **FR-010**: 系统必须在领域切换后清空搜索关键词并重置内容展示

### Key Entities

- **CampusDomain（校园领域）**: 新增类型。slug(daily/growth/deal)、名称、图标、描述。对标全球站的 Domain 类型。用于 Header 切换器和内容过滤。
- **CampusArticle（校园文章）**: 已有。需要将 category 字段映射到新领域。文章归属于某个领域。
- **CampusTopic（校园专题）**: 已有。需要将 category 字段映射到新领域。专题归属于某个领域。
- **领域配置（DomainConfig）**: 领域的展示配置（图标、名称、描述、颜色），对标全球站 DOMAIN_CONFIG。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户在首页可通过 Header 切换器一键切换 3 个领域，每次切换内容在 1 秒内更新
- **SC-002**: 校园站首页布局结构与全球站首页结构一致（Hero → 搜索 → 模块切换器 → 内容网格），视觉相似度达 90%
- **SC-003**: 用户可在模块切换器（热门推荐/专题系列）之间切换浏览，所有内容正确按领域过滤
- **SC-004**: 文章卡片样式与全球站 ArticleCard 一致，横排图文布局
- **SC-005**: 文章页三栏布局与全球站 ArticleReadView 一致（w-72 左侧栏 + 正文 + TOC）

## Assumptions

- 旧的分类页面（CategoryPage）和路由将被移除，以领域切换器完全替代
- 旧的文章 category slug（food, shopping, transport 等）需要映射到新领域 slug
- 校园站不需要"工具推荐"模块（无 Tool 概念），模块切换器只保留"热门推荐"和"专题系列"
- 校园站不实现护眼模式和语言切换（与全球站不同的功能点）
- 种子数据中的 category 字段需要更新为新领域 slug
- Footer 保持当前样式不变
- 移动端适配保持当前方式（响应式隐藏 + 底部导航），不引入新的移动端组件
