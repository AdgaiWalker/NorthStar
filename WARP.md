# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 仓库结构与 OpenSpec 工作流

- 根目录为 mono-repo 外壳，真实前端应用位于 `pangen-ai-compass/`。
- 产品单一事实来源（PRD）：`openspec/Specs/PRD-盘根AI指南针-标准版.md`。
- 本项目采用 **规格驱动开发（Spec-Driven Development）**：
  - 在改动业务逻辑前，先在 `openspec/Changes/` 下为本次需求建立子目录，编写：
    - 功能提案（User Story、目标 / Non-goals）
    - 技术方案（数据结构、API Contract、前端 UI 草图）
    - 执行清单（原子化任务，每个任务控制在 ~50 行代码内）
    - 规格增量（说明如何合并回 `openspec/Specs/` 主规格）
  - 规格评审通过后再进入编码阶段。
  - 如果代码与 PRD / 主规格冲突，应优先对齐规格，并在需要时提醒用户更新规格文档。

项目约定：
- 文档与代码注释优先使用中文。
- 如无显式兼容性要求，不额外编写旧浏览器 / 旧运行时的兼容代码。

## 常用命令（前端：pangen-ai-compass）

所有命令均在 `pangen-ai-compass/` 子目录下执行。

### 安装依赖

- 推荐：`pnpm install`
- 备选：`npm install`

> 根目录也有一个 `package.json`，其中的 `lint` 仅为占位脚本，实际开发请进入 `pangen-ai-compass/` 目录。

### 本地开发

- 启动开发服务器（Vite，默认端口 3000）：
  - `pnpm dev`
  - 或 `npm run dev`

> 开发环境下，AI 请求通过 Vite 代理转发到智谱 API，仅在本地有效，生产环境必须由后端网关持有并转发 API Key。

### 构建与预览

- 构建生产包：
  - `pnpm build`
  - 或 `npm run build`
- 本地预览已构建产物：
  - `pnpm preview`
  - 或 `npm run preview`

### 代码质量

- Lint 检查（ESLint）：
  - `pnpm lint`
  - 或 `npm run lint`
- 自动修复常见 Lint 问题：
  - `pnpm lint:fix`
- 代码格式化（Prettier）：
  - `pnpm format`

### 测试

当前 `pangen-ai-compass/package.json` 中 **未配置测试脚本**（无 `test` / `vitest` / `jest` 等命令）。
- 在添加测试框架时，请：
  - 在 `package.json` 中新增 `test` / `test:unit` 等脚本。
  - 更新本文件，补充示例命令（包括如何运行单个测试用例）。

## 运行 AI 能力所需配置

前端在开发环境中直接访问智谱 API，需要在 **本地** 配置 Key（不会被提交到 Git 中）：

- 方式一：在 `pangen-ai-compass/.zhipu.local.json` 中写入：
  - `api_key`: 智谱 API Key
  - 可选：`base_url`, `model`
- 或 方式二：在 `pangen-ai-compass/.env.development.local` 中设置：
  - `ZHIPU_API_KEY`
  - 可选：`ZHIPU_BASE_URL`

Vite 配置：
- `vite.config.ts` 通过 `loadEnv` + 读取 `.zhipu.local.json` / `.env.<mode>.local`，推导：
  - 代理目标：`zhipuBaseUrl`（默认 `https://open.bigmodel.cn/api/coding/paas/v4`）
  - 请求头：`Authorization: Bearer <ZHIPU_API_KEY>`（有 Key 时才设置）
- 对前端代码暴露的统一端点为：`POST /__zhipu/chat/completions`，由 Vite proxy 转发到实际智谱 API。

修改 / 扩展 AI 能力时，请保持：
- 不在代码里硬编码敏感 Key，仅使用上述本地配置文件。
- 优先复用 `API_ENDPOINTS.ZHIPU_CHAT`、`AIService.ts` 中已有的调用和容错逻辑。

## 前端架构总览（pangen-ai-compass）

### 技术栈

- 构建与开发：Vite 6
- 语言：TypeScript 5 + React 19
- 路由：`react-router-dom@7`（`useRoutes` + `BrowserRouter`）
- 数据拉取与缓存：`@tanstack/react-query`
- 状态管理：`zustand`（应用态 `useAppStore`，审核流 `useReviewStore`）
- UI：Tailwind CSS + `lucide-react`
- 表单与校验：`react-hook-form` + `zod`

### 入口与路由

- 入口：`src/main.tsx`
  - 使用 `ReactDOM.createRoot` 挂载到 `#root`。
  - 外层包裹：`BrowserRouter` + `QueryClientProvider` + `<App />`。
- 应用根组件：`src/App.tsx`
  - 使用 `useRoutes(routes)` 渲染路由树。
  - 顶层布局统一由 `AppHeader` / `Footer` / `MobileBottomNav` 组成。
  - 通过 `useAppStore` 控制主题模式（普通 / 护眼）、本地存储异常提示等。
- 路由配置：`src/routes.tsx`
  - 顶层页面：
    - `/` → `HomePage`
    - `/tool/:toolId` → `ToolDetailPage`
    - `/article/:articleId` → `ArticleReadPage`
    - `/solution/new` → `SolutionNewPage`
    - `/me` & `/me/:tab` → `UserCenterPage`
    - `/login` → `LoginPage`
  - 管理后台：
    - `/admin` 由 `RequireAuth` 包裹 `AdminLayout`，子路由：
      - `/admin/review-queue` → 审核队列
      - `/admin/review/:taskId` → 单条审核任务详情
      - `/admin/unassigned` → 待分配池
      - `/admin/reviewers` → 审核员管理
      - `/admin/audit` → 审计日志

> 扩展路由时，优先在 `routes.tsx` 中集中管理，再创建对应的 `pages/` 组件，保持路由表的可读性。

### UI 层结构

- `src/components/`
  - 视觉组件与复用块，例如：
    - `AppLayout.tsx`：全局导航栏、域切换（创作 / 编程 / 办公）、登录入口、Footer。
    - `AISearch.tsx`：主页顶部的 AI 搜索框，调用 AI 服务推荐工具与文章。
    - `CardComponents.tsx`：工具卡片、文章卡片、主题卡片等。
    - `FloatingDock.tsx`：底部浮动栏，展示已选工具并发起“生成方案”。
    - `RequireAuth.tsx`：简单的前端守卫组件，用于 `/admin` 路由。
  - `components/views/` 下是偏“视图级”但仍可在多页中复用的组合组件。
- `src/pages/`
  - 每个顶层路由对应一个 Page 组件，主要负责：
    - 从 store / 常量中取数据（如 `MOCK_TOOLS`、`MOCK_ARTICLES`）。
    - 切片过滤（按当前 domain 筛数据）。
    - 将事件处理和导航逻辑下发给 UI 组件。
  - `pages/admin/` 下为后台各功能页，围绕审核任务流展开。

### 全局状态与本地存储

- `src/store/useAppStore.ts`
  - 负责：主题、语言、当前领域（creative / dev / work）、登录态（前端模拟）、已选工具 ID 集合、用户保存的方案列表、本地存储异常检测标记等。
  - 通过 `storage.ts` 与 `localStorage` 交互，并对历史无效数据做 reset 检测，在 `App.tsx` 中以 toast 提示用户。
- `src/store/useReviewStore.ts`
  - 使用 `zustand` + `persist` 实现可持久化的内容审核工作流：
    - 实体：`ReviewTask`、`Reviewer`、`AuditLog`（定义于 `types/review.ts`）。
    - 功能：提交任务、自动分配（含领域匹配、WIP 上限、SLA 截止）、人工改派、进入 / 退出待分配池、审核通过 / 拒绝、修订任务提交流程、审核员暂停 / 恢复接单、审计日志写入等。
  - 常量：
    - `WIP_LIMIT`：单审核员同时进行的最大任务数。
    - `SLA_HOURS`：每条任务的服务等级时间（分配→处理完成的时限）。

- `src/utils/storage.ts`
  - 封装 `storageGet` / `storageSet` / `storageRemove`：
    - `storageGet` 接受校验函数，若读取到的旧数据结构不合法，会清理并返回 `resetDetected=true`，供 UI 给出“本地数据异常已重置”的提示。
  - `STORAGE_KEYS` 统一维护所有使用到的 localStorage key，新增持久化字段时应在此补充。

- `src/utils/quota.ts`
  - 管理游客 AI 使用额度（本机限制，不依赖后端）：
    - 分桶：`aiSearch`、`aiSolution`，默认各 3 次/天。
    - 每天本地时间 00:00 自动重置（通过 `resetAt` 时间戳控制）。
    - 提供 `getGuestQuotaState` / `consumeGuestQuota`，由上层逻辑决定是否进入“演示模式（demo）”。

### AI 集成层

- `src/constants/api.ts`
  - 暴露 `API_ENDPOINTS.ZHIPU_CHAT = '/__zhipu/chat/completions'` 供业务代码使用。
- `src/services/aiContract.ts`
  - 类型与协议定义：
    - `AISearchResultV2`：AI 搜索返回结构（模式、回退原因、总结、推荐、推荐工具名、推荐文章标题）。
    - `AISolutionResult`：AI 方案生成结果（模式、回退原因、标题、Markdown 建议内容）。
    - `FallbackReason` 枚举所有回退原因（缺 Key、网络错误、解析错误、空结果、配额耗尽等）。
- `src/services/aiFallback.ts`
  - 根据 `FallbackReason` 输出“demo 模式”下的兜底推荐 / 方案，避免前端完全失败。
- `src/services/AIService.ts`
  - 核心 AI 调用实现：
    - `searchToolsWithAI(query, availableTools, availableArticles)`：
      - 组合“工具库 / 文章库”文本上下文，构造中文 Prompt。
      - 调用智谱聊天接口（`ZHIPU_MODEL = 'glm-4.6'`），优先通过 function calling `emit_search_result_v2` 获取结构化结果，失败时尝试从 `message.content` 中提取 JSON。
      - 使用防御性 `safeParseJsonObject` + `normalizeStringArray` 解析 JSON，失败或结果为空则退回 `buildFallbackResult(...)`。
    - `generateSolutionWithAI(goal, selectedTools)`：
      - 将用户目标与已选工具列表拼入 Prompt。
      - 通过 function calling `emit_solution_v1` 获取 `{ title, aiAdvice }`，其中 `aiAdvice` 为 Markdown 内容。
      - 解析失败 / 状态码异常时回退到 `buildFallbackSolution(...)`（demo 模式）。
  - 统一处理 `response.ok` 检查，将 401/403/404 归为 `missing_key`，其他网络问题归为 `network_error`，JSON 解析失败标记为 `parse_error`，上层 UI 可依此给出更明确提示。

> 在新增 AI 能力时，推荐沿用同样的模式：先在 `aiContract.ts` 中定义结构，再在 `AIService.ts` 中集中处理调用与解析逻辑，并提供兜底路径。

### 其他工具模块

- `src/hooks/useShare.ts`
  - 抽象出复制文本到剪贴板 + “已复制”状态控制（延迟时间取自 `UI_DELAY.COPY_FEEDBACK`）。
- `src/constants/ui.ts`
  - 统一 UI 延迟 / 颜色常量（如护眼模式背景色等）。
- 其他 `utils/*`（如文档 Markdown 处理、导出、wikilink 等）提供纯函数工具，适合在业务逻辑中复用。

## 对未来 Warp Agent 的协作建议

在本仓库内进行自动化修改时，建议遵循：

1. **先看规格再改代码**
   - 修改 / 新增功能前，先阅读 `openspec/Specs/PRD-盘根AI指南针-标准版.md` 与相关 `openspec/Changes/` 文档。
   - 如需新功能，先在 `openspec/Changes/` 下补充本次改动的提案与技术方案，再协助实现代码。

2. **保持中文优先**
   - 新增或修改的文档、代码注释、UI 文案，默认使用简体中文（必要时可以在旁给出英文术语）。

3. **状态与持久化的一致性**
   - 新增全局状态优先放入 `useAppStore` / `useReviewStore`，避免在组件树中层层 prop drilling。
   - 新增需要持久化的字段时，统一通过 `STORAGE_KEYS` + `storageGet` / `storageSet`，并考虑本地数据结构升级的兼容处理。

4. **AI / 配额相关改动**
   - 任何与 AI 请求、配额、fallback 行为相关的改动，应同步更新：
     - `aiContract.ts` 中的类型定义；
     - `AIService.ts` 中的调用与解析逻辑；
     - 若影响用户体验（如额度、重置逻辑），同步更新 PRD 中的“行为说明”章节。

遵循以上约定，可以让后续的 Warp 实例在本项目中更快理解上下文，并在不破坏既有产品逻辑的前提下进行安全可靠的代码生成与编辑。