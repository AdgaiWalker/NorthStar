# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

pnpm workspace monorepo at `NorthStar/`，全栈 TypeScript：

- **前端**：React + Tailwind CSS + TypeScript
- **后端**：Node.js + TypeScript + PostgreSQL
- **包管理**：pnpm

双前端 + 单后端：

- **校园站** `frontlife-web`（xyzidea.cn）→ localhost:3001
- **全球站** `frontai-web`（xyzidea.com）→ localhost:3000
- **共享包** `shared`（`@ns/shared`）— 纯 TS，无 React/UI 依赖
- **后端** `server`（`@ns/server`）— 已有 Drizzle schema（10 表），无路由

后端通过 `SITE=cn|com` 环境变量切换站点行为。原型阶段两前端通过 Vite proxy 连接，上线后各自独立部署。

## Document Hierarchy

```
宪法（五条公理）→ 使命（specs/MISSION.md）→ PRD → 实现规格
```

- 宪法：`.specify/memory/constitution.md`（最高约束）
- 校园站 PRD：`specs/PRD-盘根校园-v8.md`
- 全球站 PRD：`specs/PRD-盘根AI指南针-标准版.md`
- 全球站实现规格：`specs/implementation/specs.md`
- 冲突时以上层为准

## Commands

```bash
cd NorthStar && pnpm install                    # 安装依赖

# 校园站
cd NorthStar/packages/frontlife-web && pnpm dev  # localhost:3001

# 全球站
cd NorthStar/packages/frontai-web && pnpm dev    # localhost:3000

# 类型检查
cd NorthStar/packages/frontlife-web && npx tsc --noEmit
cd NorthStar/packages/frontai-web && npx tsc --noEmit

# 缓存清理（修改 Vite 配置或安装新依赖后）
rm -rf NorthStar/packages/frontlife-web/node_modules/.vite
rm -rf NorthStar/packages/frontai-web/node_modules/.vite
```

### AI Local Config

原型阶段 AI 通过 Vite proxy 转发到智谱 API，两站共享同一配置文件：

```bash
# 在 workspace 根目录创建（两站共享）
echo '{"api_key":"your-key","base_url":"https://open.bigmodel.cn"}' > NorthStar/.zhipu.local.json
```

也可在各站目录下创建 `.zhipu.local.json` 作为本地覆盖（优先级更高）。两站统一代理 `/__ai` 路径。配置文件已在 `.gitignore`，勿提交。

## Key Patterns

### 校园站（frontlife-web）

- **单 Zustand store**（`store/useAppStore.ts`），persist 到 localStorage key `frontlife-storage`
- **全局 overlay 模式**：SearchOverlay / CreateMenuOverlay / PostPreviewModal / SpotlightBar 在 App.tsx 根层渲染，由 store 中的 toggle 控制
- **移动端优先**：BottomNav 是 `md:hidden`，Header tabs 是 `hidden md:flex`，SpotlightBar 仅移动端
- **路径别名**：`@/` → `src/`
- **Tailwind 自定义 token**：颜色（sage 主色、ink 文字、amber 警告、rose）、间距（nav-h 56px、bottom-nav-h 60px、content-max 960px、reader-max 720px）
- **内容渲染**：react-markdown + rehype，自定义 CodeBlock / ImageRenderer / Callout 组件
- **Mock 数据**：`src/data/mock.ts`（用户、知识库、文章、帖子、Feed），当前所有数据走 mock

### 全球站（frontai-web）

- **三个 Zustand store**：useAppStore（全局状态 + 认证）、useReviewStore（审核流程）、useContentStore（内容管理）
- **Admin 路由**：`/admin/*` 包裹在 `<RequireAuth>` + `<AdminLayout>` 中
- **AI 服务**：`services/AIService.ts` 调用智谱 Chat API，支持 function calling；失败时回退到 `aiFallback.ts` 的关键词匹配
- **返回结构**：所有 AI 调用返回 `mode: 'ai' | 'demo'` + `fallbackReason`

### 共享包（@ns/shared）

关键导出：
- `types.ts`：Domain / CampusDomain / Tool / Article / Topic / CampusArticle / CampusTopic / User / ContentType 等
- `frontlife-constants.ts`：8 分类（arrival/food/…/pitfalls）+ 3 展示领域（daily/growth/deal）+ DOMAIN_MAP 映射
- `frontlife-seed.ts`：校园站种子数据（8 专题 + ~67 篇文章）
- `sensitive.ts`：6 类敏感词（政治/色情/暴力/赌博/违禁/辱骂），输入拦截 + 输出过滤
- `ai-contract.ts`：AI 搜索/方案生成的请求响应类型

### 服务端（server）

已有 `src/db/schema.ts`：Drizzle ORM + PostgreSQL，定义 10 张表（cities / users / knowledge_bases / articles / posts / post_replies / feedbacks / activities / auth_requests / favorites / notifications）。无路由和入口文件。

## Constraints

- 前端构建产物不得包含任何 API Key
- cn 用户数据绝不流向海外；com 站禁止收集中国敏感个人信息
- 两站账号体系完全独立，跳转不传递登录态
- `@ns/shared` 必须保持纯 TS，不得引入 React 或任何 UI 依赖
- 敏感词管控：`shared/src/sensitive.ts`，输入拦截 + 输出过滤
- UI 图标统一使用 Lucide（SVG），禁止 emoji 做 UI 图标。emoji 只出现在用户输入的文本中
- 文档/注释中文，变量/函数/类型英文驼峰
- 校园站数据层 8 分类 → 展示层 3 领域（映射见 `frontlife-constants.ts` DOMAIN_MAP）
