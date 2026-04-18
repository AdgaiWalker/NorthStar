# NS Development Guidelines

> Last updated: 2026-04-18

## Architecture

pnpm workspace monorepo：代码位于 `NorthStar/`，`@ns/shared` 提供跨产品共享代码。

- **双前端 + 单后端**：校园站（xyzidea.cn）和全球站（xyzidea.com）各自独立前端，共享一个 Hono 后端
- 后端通过 `SITE=cn|com` 环境变量切换站点行为
- 原型阶段：单后端实例 + 单数据库，两前端通过 Vite proxy 连接
- 上线阶段：同一套代码部署两份，各自连各自的数据库

## Active Technologies

- **前端**：TypeScript 5.8 + React 19 + Zustand 5 + React Router v7 + Tailwind CSS 3 + lucide-react + react-markdown
- **后端**：Node.js + Hono + Drizzle + Zod + PostgreSQL + pnpm
- **AI**：智谱 GLM-4-Flash（通过后端 AI 网关代理调用，原型阶段通过 Vite proxy）
- **存储**：原型阶段 localStorage（Zustand persist）；后端搭建后迁移至 PostgreSQL

## Project Structure

```text
NS/
├── CLAUDE.md                   # AI 开发指南（本文件）
├── AGENTS.md                   # Agent 指南
├── specs/                      # 规格文档
│   ├── PRD-盘根AI指南针-标准版.md
│   └── implementation/specs.md
│
└── NorthStar/                  # 所有代码
    ├── pnpm-workspace.yaml
    ├── tsconfig.base.json
    └── packages/
        ├── shared/             # @ns/shared — 跨产品共享（纯 TS）
        │   └── src/
        │       ├── types.ts    # Article, Tool, User, CampusArticle, CampusTopic...
        │       ├── api.ts      # API_ENDPOINTS
        │       ├── ai-contract.ts
        │       ├── ai-utils.ts
        │       ├── sensitive.ts # 敏感词管控
        │       ├── frontlife-seed.ts      # 校园站种子文章数据（67 篇文章 + 8 专题）
        │       ├── frontlife-constants.ts  # 校园站 8 分类 + 3 领域 DOMAIN_MAP
        │       └── index.ts
        ├── frontai-web/        # 全球站（xyzidea.com）→ localhost:3000
        │   └── src/
        │       ├── components/ # 全球站组件（含 admin/）
        │       ├── pages/      # 路由页面
        │       ├── services/   # AIService（引用 @ns/shared）
        │       ├── store/      # Zustand stores
        │       └── ...
        └── server/             # @ns/server — 后端（待建）
```

## Current Status (v0.1.0)

- **frontai-web**（全球站）：可运行，localhost:3000
- **frontlife-web**（校园站）：**已删除**，等待重建。种子数据和分类定义已提取到 `@ns/shared`
- **server**（后端）：空壳，待建

### 校园站数据说明

校园站代码已删除，但以下数据保存在 `@ns/shared` 中，供未来重建使用：

- **`shared/src/frontlife-seed.ts`**：种子数据（SEED_TOPICS: 8 个专题，SEED_ARTICLES: ~67 篇文章，含标题/摘要/正文 markdown）
- **`shared/src/frontlife-constants.ts`**：8 个生活分类（arrival/food/shopping/transport/admin/activity/secondhand/pitfalls）+ 3 个展示领域（daily/growth/deal）+ DOMAIN_MAP 映射
- 数据层 8 分类，展示层 3 领域，映射关系见 `frontlife-constants.ts` 中的 `DOMAIN_MAP`

## Commands

```bash
# 根目录安装
cd NorthStar && pnpm install

# 全球站
cd NorthStar/packages/frontai-web && pnpm dev    # localhost:3000

# 编译检查
cd NorthStar/packages/frontai-web && npx tsc --noEmit
```

## Code Style

- 语言：文档/注释中文，变量/函数/类型英文驼峰
- 宪法为最高约束：`.specify/memory/constitution.md`
- PRD 为单一事实来源：`specs/PRD-盘根AI指南针-标准版.md`
- 实现规格：`specs/implementation/specs.md`

## Key Constraints

- 前端构建产物不得包含任何 API Key
- cn 用户数据绝不流向海外；com 站禁止收集中国敏感个人信息
- 两站账号体系完全独立，跳转不传递登录态
- 校园站数据层 8 分类，展示层 3 领域（映射见 `shared/src/frontlife-constants.ts` DOMAIN_MAP）
- 敏感词管控：输入拦截 + 输出过滤，词库位于 `shared/src/sensitive.ts`
- 文档优先级：宪法 > PRD > specs.md > 其他（product_planning.md 仅参考策略，技术细节以 specs.md 为准）
