# 盘根校园站前端补全方案

> 基于 PRD v8.0 与当前实现差距分析
> 目标：从 ~65% 完成度 → 生产可用

---

## 总体策略

按 **5 波推进**，每波有明确交付物，可独立测试。

```
Wave 1: 核心体验闭环（纯前端，可立即开始）
Wave 2: AI 能力接入（依赖后端 AI 网关）
Wave 3: 知识库结构增强（纯前端 + 数据结构调整）
Wave 4: 辅助功能（体验优化）
Wave 5: 远期功能（上线后迭代）
```

---

## Wave 1: 核心体验闭环（预计 3-4 天）

目标：让基础浏览和发布流程完整可用，无需后端即可演示。

### 1.1 发帖子独立流程

**问题**：当前点击"发帖子"进入 `/write`，与写文章共用长文流程。

**方案**：
- 新建 `/post/create` 路由 + `CreatePostPage`
- 页面极简：文本框（最多 500 字）+ 标签选择（#求助/#二手/#活动/#讨论/#分享）+ 发布按钮
- 发布后跳转到新帖子详情页
- 数据先写入 Zustand store + localStorage（等后端对接后替换为 API）

**变更文件**：
- `src/pages/CreatePostPage.tsx`（新建）
- `src/App.tsx`（路由）
- `src/components/CreateMenuOverlay.tsx`（发帖子跳转 `/post/create`）
- `src/store/useAppStore.ts`（添加 posts 数组管理）

### 1.2 滑动加载 + 活动排序

**问题**：Feed 为静态数组，无无限滚动，无活动排序。

**方案**：
- 用 `IntersectionObserver` 实现底部检测，加载下一页
- 每批加载 10 条，带骨架屏过渡
- 活动排序逻辑（前端 mock 阶段）：每条内容维护 `lastActivityAt` 时间戳，按此倒序
- 活动行为包括：阅读、收藏、反馈、回复、作者更新

**变更文件**：
- `src/hooks/useInfiniteFeed.ts`（新建，IntersectionObserver hook）
- `src/pages/HomePage.tsx`（接入滑动加载）
- `src/components/FeedSkeleton.tsx`（新建，骨架屏）
- `src/data/mock.ts`（为每条数据补充 `lastActivityAt`）

### 1.3 Markdown 渲染增强

**问题**：代码块无高亮、图片无样式、无 Callout 语义。

**方案**：
- 引入 `react-syntax-highlighter` + `Prism` 主题，代码块支持语法高亮 + 一键复制按钮
- 图片添加圆角 + 点击放大（简易 lightbox）
- Callout 解析：自定义 `react-markdown` 组件，识别 `> [!note]` / `> [!warning]` / `> [!tip]` 语法，渲染为带图标和背景色的卡片

**变更文件**：
- `src/components/markdown/`（新建目录）
  - `CodeBlock.tsx`
  - `ImageRenderer.tsx`
  - `Callout.tsx`
- `src/pages/KBDetailPage.tsx`（更新 ReactMarkdown components）

### 1.4 设计规范对齐

**问题**：卡片圆角 14px（PRD 要求 12px），按钮圆角不统一。

**方案**：
- 统一使用 Tailwind 自定义配置：`--radius-card: 12px`, `--radius-button: 8px`
- 全局替换 `rounded-[14px]` → `rounded-card`
- 按钮统一 `rounded-button`

**变更文件**：
- `tailwind.config.js`（添加 `borderRadius` token）
- 全局替换

---

## Wave 2: AI 能力接入（预计 2-3 天，需后端配合）

目标：AI 搜索、AI 写作、AI 摘要全部可用。

### 2.1 AI 搜索兜底

**问题**：本地搜索无结果时仅显示"未找到相关内容"。

**方案**：
- 本地搜索返回空后，自动调用 `/api/ai/search`（后端 AI 网关）
- 展示 AI 回答卡片（带"AI 生成"标识）
- AI 回答下方附推荐文章列表
- 流式响应（SSE），打字机效果展示

**变更文件**：
- `src/services/aiService.ts`（新建，封装 AI API）
- `src/components/SearchOverlay.tsx`（接入 AI 搜索逻辑）
- `src/components/AIAnswerCard.tsx`（新建）

### 2.2 AI 对话式写作真实集成

**问题**：AI 回复为硬编码 setTimeout mock。

**方案**：
- 接入后端 `/api/ai/writing` 对话接口
- 流式接收 AI 追问，实时展示
- AI 根据对话内容生成文章大纲，用户可确认/修改
- 支持 Markdown 实时预览

**变更文件**：
- `src/services/aiService.ts`（添加 writing 接口）
- `src/pages/WritePage.tsx`（替换 mock 为真实 API）

### 2.3 AI 摘要

**问题**：长文章无自动摘要。

**方案**：
- 文章页顶部展示 AI 生成的摘要卡片（折叠态）
- 首次打开时调用 `/api/ai/summary` 生成摘要并缓存
- 摘要长度控制在 100 字以内

**变更文件**：
- `src/components/AISummary.tsx`（新建）
- `src/pages/KBDetailPage.tsx`（顶部插入摘要卡片）

---

## Wave 3: 知识库结构增强（预计 3-4 天）

目标：知识库支持层级结构、悬浮卡片、高级搜索。

### 3.1 子文章嵌套（飞书风格）

**问题**：文章列表为扁平数组，无层级。

**方案**：
- 数据模型扩展：文章增加 `parentId` 和 `childrenIds` 字段
- 导航树支持展开/折叠子文章
- 父文章可包含子文章列表（嵌入式卡片）
- 无限层级递归渲染

**变更文件**：
- `src/types.ts`（扩展 ArticleData 类型）
- `src/data/mock.ts`（添加嵌套示例数据）
- `src/pages/KBDetailPage.tsx`（导航树递归渲染）

### 3.2 悬浮窗卡片（Skill Card）

**问题**：文章内无引用卡片组件。

**方案**：
- 自定义 Markdown 语法：`[[卡片标题]]` 或 `<skill-card id="xxx" />`
- 渲染为可展开/收起的卡片，内部展示提示词/模板/关联文章
- 支持代码块、列表等富内容

**变更文件**：
- `src/components/markdown/SkillCard.tsx`（新建）
- `src/pages/KBDetailPage.tsx`（更新 ReactMarkdown components）

### 3.3 知识库搜索与排序

**问题**：搜索框和排序均未实现。

**方案**：
- 搜索框实时过滤知识库列表
- 添加排序切换 Tab：热门（收藏+阅读加权）/ 最新创建 / 最多文章
- 分类筛选器（日常起居 / 成长提升 / 精明消费）

**变更文件**：
- `src/pages/KBListPage.tsx`（添加搜索/排序/筛选逻辑）

---

## Wave 4: 辅助功能（预计 2-3 天）

### 4.1 暗色模式

**方案**：
- Tailwind `dark:` 变体全面覆盖
- CSS 变量切换（light/dark 两套 token）
- Zustand 持久化用户偏好
- 系统偏好自动检测

**变更文件**：
- `tailwind.config.js`（启用 `darkMode: 'class'`）
- `src/index.css`（定义 dark token）
- `src/store/useAppStore.ts`（添加 theme 状态）
- 全局组件添加 `dark:` 样式

### 4.2 真实认证审核流程

**问题**：点击"申请认证"直接通过。

**方案**：
- 申请认证页：填写申请理由 + 提交
- 状态展示：待审核 / 已通过 / 已拒绝
- 对接后端 `/api/auth/certification/apply`

**变更文件**：
- `src/pages/CertApplyPage.tsx`（新建）
- `src/store/useAppStore.ts`（添加 certificationStatus）

### 4.3 移动端 TOC 折叠

**问题**：移动端知识库详情页无 TOC。

**方案**：
- 移动端：标题下方添加"目录"折叠按钮
- 点击展开抽屉式 TOC，点击条目后自动收起

**变更文件**：
- `src/pages/KBDetailPage.tsx`（添加移动端 TOC 抽屉）

---

## Wave 5: 远期功能（上线后迭代）

| 功能 | 依赖 | 预估工时 |
|---|---|---|
| Obsidian 格式兼容 | 渲染器扩展 | 2-3 天 |
| Obsidian Vault 导入 | 文件解析 + 后端接口 | 3-4 天 |
| 双向同步 | 后端 API + 插件开发 | 5-7 天 |
| 阅即编（段落级内联编辑） | 复杂前端交互 | 4-5 天 |
| 知识库协作 | 后端权限系统 | 3-4 天 |
| 多城市支持 | 后端城市隔离 + 前端切换 | 2-3 天 |
| AI 文章工具箱 | AI 接口扩展 | 2-3 天 |
| 认领机制 | 后端权限 + 前端 UI | 2-3 天 |
| 本地商家入驻 | 后端商家系统 + 前端页面 | 4-5 天 |

---

## 后端依赖清单

以下功能需要后端配合：

| 功能 | 需后端提供 |
|---|---|
| AI 搜索 | `POST /api/ai/search`（流式 SSE） |
| AI 写作 | `POST /api/ai/writing`（流式对话） |
| AI 摘要 | `POST /api/ai/summary` |
| 滑动加载真实数据 | `GET /api/feed?cursor=&limit=` |
| 发帖子 | `POST /api/posts` |
| 认证申请 | `POST /api/auth/certification/apply` + 状态查询 |
| 内容活性统计 | `POST /api/interact/helpful` + `/changed` |
| 认领机制 | `POST /api/kb/:id/claim` |

---

## 推荐实施顺序

```
第 1 周：Wave 1（核心体验闭环）
  → 发帖子 + 滑动加载 + Markdown 增强 + 设计规范对齐

第 2 周：Wave 2（AI 能力）+ Wave 3 前半（子文章嵌套）
  → AI 搜索/写作/摘要 + 层级导航树

第 3 周：Wave 3 后半 + Wave 4
  → 悬浮卡片 + 知识库排序筛选 + 暗色模式 + 认证流程

第 4 周起：Wave 5（按优先级逐个迭代）
```

---

## 当前可立即开始（无需后端）

Wave 1 的全部内容 + Wave 3 的子文章嵌套（纯数据结构调整）+ Wave 4 的暗色模式 + 移动端 TOC，都可以在前端独立完成。

建议先完成 **Wave 1**，让校园站达到"可完整演示"状态。
