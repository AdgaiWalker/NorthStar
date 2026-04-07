# Feature Specification: 校园生活与 AI 工具前端剥离

**Feature Branch**: `001-dual-face-architecture`
**Created**: 2026-04-06
**Status**: Draft
**Input**: 现有 pangen-ai-compass 把 AI 工具和校园生活混在一起，需要拆成两个独立前端。

---

## 核心约束：合规驱动分离

**校园前端部署在中国服务器**，需要 ICP 备案，不能依赖任何海外 API。
**AI 前端部署在海外服务器**，可自由调用国外 AI 服务。

```
校园前端（国内）                    AI 前端（海外）
├── 中国服务器 + ICP 备案             ├── 海外服务器
├── 禁止调用海外 API                  ├── 可调用智谱/OpenAI 等
├── 独立域名                          ├── 独立域名
├── 自有用户体系（国内数据库）          ├── 自有用户体系
└── 纯内容消费，无 AI 功能             └── AI 搜索/方案/工具
```

由此推导：
- 两端**完全独立部署**，不能共享 Cookie/Token/Session
- 用户体系**各自独立**（国内用户数据和海外用户数据物理隔离）
- 校园前端**不包含任何 AI 功能**（不调智谱、不调 OpenAI）
- 共享层仅限于**前端代码**（组件、工具函数、类型），不共享运行时状态

---

## 现状与目标

**现状**：一个前端，AI 工具和校园生活全混在一起。

**目标**：两个独立前端，独立部署，共享前端代码层。

```
pangen-ai-compass/（同一项目）
├── shared/              ← 共享前端代码（组件、utils、types）
├── ai/                  ← AI 前端入口 → 构建产物 → 部署到海外
└── campus/              ← 校园前端入口 → 构建产物 → 部署到国内

前端 A：AI 工具（海外）              前端 B：校园生活（国内）
┌─────────────────────┐              ┌─────────────────────┐
│ 首页（搜索+推荐）     │              │ 首页（8 个分类入口）  │
│ 工具详情             │              │ 分类内容列表          │
│ 工具选择 + 浮动 Dock  │              │ 内容阅读页            │
│ 方案生成 / 导出       │              │ 收藏                 │
│ 收藏 / 设置          │              │ 学生认证              │
│ 学生认证             │              │ 用户中心（简化版）     │
│ AI 搜索              │              │                     │
│ 后台管理             │              │                     │
│ 用户中心             │              │                     │
└─────────────────────┘              └─────────────────────┘
     海外服务器                            中国服务器
  无 ICP 备案要求                      需要 ICP 备案
```

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 新生在校园前端浏览内容 (Priority: P1)

大一新生打开校园前端，看到 8 个分类，点击"吃"，浏览食堂测评，点进去阅读。

**Acceptance Scenarios**:

1. **Given** 校园前端已启动且有种子内容，**When** 打开首页，**Then** 看到 8 个分类入口
2. **Given** 点击"吃"分类，**Then** 展示该分类下已发布内容列表
3. **Given** 点击某篇内容，**Then** 阅读页正常渲染 Markdown

---

### User Story 2 - 站长在后台创建校园内容 (Priority: P1)

站长在后台写了一篇校园内容，发布后校园前端可见。

**Acceptance Scenarios**:

1. **Given** 后台内容管理，**When** 选择校园面 + 分类并发布，**Then** 校园前端可见
2. **Given** 内容设为 campus + schoolId，**When** 未认证用户浏览校园前端，**Then** 内容不可见

---

### User Story 3 - AI 前端不受影响 (Priority: P1)

剥离后 AI 前端所有现有功能照常工作。

**Acceptance Scenarios**:

1. **Given** 剥离完成，**When** AI 前端全部功能验收，**Then** 搜索、工具、方案、导出、收藏、设置、后台均正常
2. **Given** 校园前端有内容，**When** AI 前端搜索，**Then** 不出现校园内容

---

### User Story 4 - 用户状态两端通用 (Priority: P2)

**Acceptance Scenarios**:

1. **Given** AI 前端已登录/认证，**When** 打开校园前端，**Then** 保持登录态和认证状态

---

### Edge Cases

- 校园前端访问 campus 内容未认证 → 锁定态 + 认证引导
- 分类无内容 → 空态
- 直链访问 campus 内容 → 拦截
- 后台按面筛选 → 正确隔离

---

## Requirements *(mandatory)*

### 项目结构

- **FR-001**: 现有 pangen-ai-compass 重构为共享层 + 两个前端入口（同一项目，两个 Vite 入口）
- **FR-002**: 共享层包含复用的组件、工具函数、类型、store、服务
- **FR-003**: AI 前端保留现有全部页面和路由（零改动）
- **FR-004**: 校园前端提供：首页（分类网格）、分类列表页、阅读页、收藏、认证、简化用户中心
- **FR-005**: 后台管理保留在 AI 前端中
- **FR-006**: 校园前端构建产物部署至 `xyzidea.cn`（国内服务器 + ICP 备案）
- **FR-007**: AI 前端构建产物部署至 `xyzidea.com`（海外服务器）
- **FR-008**: 校园前端禁止调用任何海外 API（不调智谱、不调 OpenAI、不调任何境外服务）
- **FR-009**: 两端用户体系完全独立，不共享 Cookie/Token/Session

### 校园前端

- **FR-010**: 首页展示 8 个分类：新生报到、吃、买、出行、办事、活动、二手、避坑
- **FR-011**: 复用共享层阅读页（DocRenderer + TOC + 受控块 + 双链）
- **FR-012**: 复用受众分层（public/campus + schoolId 隔离）
- **FR-013**: 复用收藏功能
- **FR-014**: 不包含：工具选择、浮动 Dock、方案生成、导出、AI 搜索

### 数据模型

- **FR-020**: ContentItem 扩展 `face` 字段（`'ai' | 'campus-life'`），默认 `'ai'`
- **FR-021**: ContentItem 扩展 `category` 字段（校园面时为分类标识）
- **FR-022**: 现有内容 face 默认 'ai'，无感

### 搜索隔离

- **FR-030**: AI 前端仅检索 face='ai'
- **FR-031**: 校园前端仅检索 face='campus-life'

### 后台

- **FR-040**: 支持按 face 筛选内容
- **FR-041**: 新建内容时可选择 face 和分类

### Key Entities

- **Face**: `'ai' | 'campus-life'`
- **CampusLifeCategory**: `arrival | food | shopping | transport | admin | activity | secondhand | pitfalls`
- **CampusCategoryDef**: 分类定义接口，包含 `slug`、`name`、`icon`、`color`、`description`、`sortOrder`（排序权重）、`enabled`（是否在 UI 中展示）
- **CampusArticle**: 文章接口，包含 `id`、`title`、`summary`、`content`、`coverImage`、`category`、`visibility`（`'public' | 'campus'`）、`schoolId`（campus 可见性时必填）、`views`、`likes`、`publishedAt`、`createdAt`、`updatedAt`、`topicId`（可选）

---

## Success Criteria *(mandatory)*

- **SC-001**: 校园前端可独立启动，正常浏览内容
- **SC-002**: 校园前端每个分类至少 1 篇种子内容
- **SC-003**: 站长后台 3 分钟内创建并发布校园内容
- **SC-004**: 两端搜索互不污染
- **SC-005**: AI 前端现有功能零回归

---

## Clarifications

### Session 2026-04-06

- Q: 项目结构怎么拆？ → A: 同一个项目内两个 Vite 入口（两个 index.html + main.tsx），共享代码通过相对路径引用
- Q: 校园前端需要独立用户中心吗？ → A: 需要。校园前端部署在国内，AI 前端在海外，用户体系必须物理隔离，校园前端需要自己的简化用户中心（收藏 + 认证 + 设置）
- Q: 分离的主要驱动是什么？ → A: 合规。校园前端需要 ICP 备案，部署在中国服务器，禁止依赖海外 API。AI 前端部署海外，可自由调用国外 AI 服务。两端完全独立部署。
- Q: 部署域名？ → A: xyzidea.cn（校园前端，国内）、xyzidea.com（AI 前端，海外）
- Q: 校园前端 V1 后端方案？ → A: 不做后端。V1 使用 localStorage + mock 数据，与 AI 前端 V1 模式相同
- Q: 校园前端 V1 需要用户登录吗？ → A: 不需要。V1 内容全部公开，不做登录/注册，用户体系后续版本再加
- Q: 两端后端技术栈？ → A: 完全一致：Hono.js + Prisma + PostgreSQL。区别仅在部署位置和业务功能。但 V1 都不做后端
- Q: AI 调用哪个厂商？ → A: 智谱 AI（国内厂商），通过后端 AI 网关调用
- Q: 当前优先级？ → A: 只做前端，不做任何后端

## Assumptions

- 从现有项目剥离，不新建仓库
- 校园前端 V1 以站长自建内容为主
- 校园内容格式统一为 Markdown + 受控块
- **V1 只做前端，不做任何后端**
- 校园前端 V1 使用 localStorage + mock 数据（与 AI 前端 V1 完全相同的模式）
- 后端（Hono.js + Prisma + PostgreSQL）统一在后续版本实现
- AI 调用：智谱 AI（国内厂商），通过后端 AI 网关调用（后续版本）
- 校园前端 V1 不做用户登录/注册，内容全部公开访问
- 校园前端暂不做评论、点赞
- "生活专区"提案被本方案取代
- 校园前端暂不做独立管理后台
