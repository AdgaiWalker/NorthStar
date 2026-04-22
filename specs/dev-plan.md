# 盘根校园站 — 研发方案

> 版本：v1.0
> 日期：2026-04-22
> 研发主导：Pieter Levels
> 技术顾问：Adam Wathan（前端）、Kent C. Dodds（质量）
> 架构前置：第七次会议（Evan You 主导）
> 会议纪要：`specs/meetings/meeting-08-dev-plan.md`

---

## 核心原则

**一个人用一个功能，比一百个人看一个 demo 有价值。**

- 每周一个可验证的目标
- 每周给真人用一次
- 数据驱动下一步，不靠猜
- AI 写最小可用版本，跑通后再优化

---

## 技术栈（已定）

| 层 | 技术 |
|---|------|
| 前端 | React 19 + TypeScript + Tailwind CSS 3 + Zustand 5 |
| 后端 | Hono + Drizzle ORM + PostgreSQL |
| AI | 智谱 GLM-4-Flash（后端代理） |
| 开发 | Claude Code（AI 辅助） |
| 测试 | Vitest |
| 构建 | Vite 6 |

---

## 三周计划

### 第一周：核心路径跑通（mock 数据）

**目标：** 一个人搜到一篇文章并点了"有帮助"

**核心路径：**
```
学生打开 → 搜"食堂" → 看到"二食堂麻辣烫测评" → 点进去 → 读完 → 点"有帮助"
```

#### 做

| 任务 | 说明 |
|------|------|
| 首页搜索框 | 输入框 + 提交，跳转搜索结果页 |
| 搜索结果页 | 仅本地匹配（mock 数据内搜索），搜不到显示"暂时没有内容，你可以来补充" |
| 文章阅读页 | Markdown 正文渲染 + 底部"有帮助"按钮 |
| Mock 数据 | 3-5 篇食堂相关文章（三周结束时扩展到 20-30 篇） |

#### 不做

推荐卡片、信息流、帖子系统、AI 回答、后端、空间页、个人页、桌面端、Store 拆分

#### 验证

找一个同学，让他用手机搜"食堂"。看他能不能走完全程（搜到→点进去→读完→点"有帮助"）。记录他卡在哪里。

---

### 第二周：接后端 + 开 AI 回答

**目标：** 10 个人用，数据从数据库来，AI 能兜底

#### 做

| 任务 | 说明 |
|------|------|
| 后端骨架 | Hono 入口 + 5 个 API 端点（见下方） |
| 逐个替换 mock | 空间列表 → 文章详情 → 帖子。用 `VITE_USE_MOCK=true` 切换，每次替换独立 |
| 开启 AI 搜索兜底 | 搜不到时后端调智谱 AI 返回回答，标注"由 AI 生成" |
| Store 拆分 | 单 store 拆为 useSearchStore / useSpaceStore / useUserStore |
| 核心路径测试 | Vitest 端到端测试：搜索→文章→确认 |
| 内容扩展 | 20 篇（团队手写 + `@ns/shared` 种子数据导入） |

#### API 端点（第七次会议确定）

```
GET    /api/spaces          — 空间列表
GET    /api/spaces/:id      — 空间详情 + 文章列表
GET    /api/articles/:id    — 文章详情
POST   /api/posts           — 发帖
GET    /api/me/permissions  — 当前用户权限
```

#### Mock 替换顺序

```
空间列表（GET /api/spaces）
  ↓ 跑通确认
文章详情（GET /api/articles/:id）
  ↓ 跑通确认
帖子（POST /api/posts）
```

每次替换后验证功能正常。出问题回退到 mock（`VITE_USE_MOCK=true`）。

#### 验证

10 个同学试用。记录搜索 query 和点击行为。核心路径测试 CI 跑着。

---

### 第三周：数据驱动迭代

**目标：** 有人第二次回来用

#### 做

| 任务 | 触发条件 |
|------|---------|
| 补内容 | 第二周数据中高频无结果 query → 写对应文章 |
| 调搜索 | 第二周数据中搜到了但没点击 → 改搜索匹配/展示 |
| 加推荐卡片 | 有真实点击数据后，从"编辑精选"切换到基于数据的推荐 |
| 修交互 | 第二周用户反馈的体验问题 |

#### 验证

第二周试用过的同学中，有没有人第二次回来用。回来 = 方向对了。

---

## 执行原则

### Pieter — 节奏

- 每周一个可验证的目标
- 每周给真人用一次
- 数据驱动下一步，不靠猜
- AI 写最小可用版本，跑通后再优化

### Adam — 前端

- 不提取组件，除非同一个 UI 模式出现 3 次以上
- AI 写的样式保持内联，不抽 utility function
- 两站样式独立演进，不强求统一
- 逐个替换 mock，不要一刀切

### Kent — 质量

- 核心路径写端到端测试（Vitest：搜索→文章→确认），CI 跑着
- TypeScript 类型先于实现——给 Claude 的 prompt 里先附上类型定义，再让它写实现代码
- Store 按领域拆分（第二周执行）
- 后端权限 API 返回具体能力（canPost / canWrite / canCreateSpace），前端不查等级数字

---

## 文件变更预估

### 第一周

| 文件 | 操作 |
|------|------|
| `frontlife-web/src/pages/HomePage.tsx` | 修改（搜索框） |
| `frontlife-web/src/pages/SearchResultPage.tsx` | 新建 |
| `frontlife-web/src/pages/ArticleReadPage.tsx` | 修改（阅读页 + 有帮助按钮） |
| `frontlife-web/src/data/mock.ts` | 修改（精简到 3-5 篇） |

### 第二周

| 文件 | 操作 |
|------|------|
| `server/src/index.ts` | 新建（Hono 入口） |
| `server/src/routes/*.ts` | 新建（5 个路由文件） |
| `server/drizzle.config.ts` | 新建 |
| `server/package.json` | 修改（加依赖） |
| `server/tsconfig.json` | 新建 |
| `frontlife-web/src/services/api.ts` | 新建（薄 HTTP 客户端） |
| `frontlife-web/src/store/useSearchStore.ts` | 新建 |
| `frontlife-web/src/store/useSpaceStore.ts` | 新建 |
| `frontlife-web/src/store/useUserStore.ts` | 新建 |
| `frontlife-web/src/store/useAppStore.ts` | 修改（拆分后精简） |
| `frontlife-web/vite.config.ts` | 修改（proxy 到后端） |
| `frontlife-web/vitest.config.ts` | 新建 |
| `frontlife-web/tests/search-to-confirm.test.ts` | 新建 |

### 第三周

视第二周数据决定，无法预估。

---

## 与架构决策的关系

| 来源 | 内容 | 本方案如何落实 |
|------|------|--------------|
| 第七次·后端先行 | 5 个 API 端点 | 第二周执行 |
| 第七次·信任等级简化 | 前端只查权限 | 第二周 `GET /api/me/permissions` |
| 第七次·AI 网关统一 | 后端代理 AI | 第二周后端 AI 路由 |
| 第七次·内容层级限两层 | 文章最多嵌套一层 | 第一周文章页实现时遵循 |
| 第七次·Mock 共存 | `VITE_USE_MOCK` 切换 | 第二周逐个替换时使用 |
