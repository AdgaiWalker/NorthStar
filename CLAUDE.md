# NS Development Guidelines

> Last updated: 2026-04-12

## Architecture

双前端 + 单后端：两个 React 前端（cn 校园站 / com 全球站）共享一个 Hono 后端，通过 `SITE=cn|com` 环境变量切换站点行为。

- 原型阶段：单后端实例 + 单数据库，两前端通过 Vite proxy 连接
- 上线阶段：同一套代码部署两份，各自连各自的数据库

## Active Technologies

- **前端**：TypeScript 5.8 + React 19 + Zustand 5 + React Router v7 + Tailwind CSS 3 + lucide-react + react-markdown
- **后端**：Node.js + Hono + Drizzle + Zod + PostgreSQL + pnpm
- **AI**：智谱 GLM-4-Flash（通过后端 AI 网关代理调用，原型阶段通过 Vite proxy）
- **存储**：原型阶段 localStorage（Zustand persist）；后端搭建后迁移至 PostgreSQL

## Project Structure

```text
NorthStar/
├── pangen-ai-compass/       # 前端（双站共享代码仓库）
│   ├── index.html            # 全球站入口
│   ├── campus.html           # 校园站入口
│   ├── vite.config.ts        # 多页构建配置
│   └── src/
│       ├── campus/           # 校园站代码（独立目录）
│       ├── components/       # 全球站组件
│       ├── constants/        # 共享常量
│       └── ...
├── server/                   # 后端（单后端，SITE 环境变量区分站点）
│   └── src/
│       ├── index.ts          # Hono 入口
│       ├── config.ts         # 站点配置
│       ├── db/schema.ts      # Drizzle 表定义
│       ├── middleware/       # auth, siteDetect, rbac
│       ├── routes/           # cn-auth, com-auth, content, ai, search, ...
│       └── services/         # 业务逻辑
└── specs/                    # 规格文档
    ├── PRD-盘根AI指南针-标准版.md   # 产品需求文档（权威来源）
    ├── implementation/specs.md      # 实现规格
    └── 012-campus-rebuild/          # 校园站重建规格
```

## Commands

```bash
# 前端开发
cd NorthStar/pangen-ai-compass
pnpm install
pnpm dev          # http://localhost:5173（全球站）+ http://localhost:5173/campus.html（校园站）

# 后端开发（搭建后）
cd NorthStar/server
pnpm install
pnpm dev          # 启动 Hono 后端
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
- 校园站代码位于 `src/campus/`，不共享导航组件
- 校园站当前使用 8 分类，3 领域重构待后续版本
