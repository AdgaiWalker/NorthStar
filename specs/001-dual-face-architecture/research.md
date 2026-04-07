# Research: 校园前端技术决策

## Decision 1: 多入口 Vite 方案

**Decision**: 同一项目内使用两个独立 Vite 配置文件，各自引用自己的 `index.html` 和 `main.tsx`。

**Rationale**:
- 两个前端需要完全独立的构建产物（一个部署国内，一个部署海外）
- 共享代码通过文件系统路径引用，不需要 workspace 或 npm link
- 各自独立的 `vite.config.ts` 可以配置不同的 proxy、环境变量、构建输出目录
- `package.json` 中通过不同 script 区分：`dev:ai` / `dev:campus` / `build:ai` / `build:campus`

**Alternatives considered**:
- 单个 vite.config.ts + build.rollupOptions.input：可行但共享配置容易混乱，构建产物混合
- 两个独立仓库：代码复用困难，同步成本高
- Monorepo (turborepo/nx)：对当前项目规模过重

## Decision 2: 校园后端框架选择

**Decision**: Hono.js + Prisma + PostgreSQL

**Rationale**:
- 与项目宪法中指定的后端技术栈一致（PRD §18.3）
- Hono.js 轻量，适合 Node.js 部署，TypeScript 原生
- Prisma 类型安全，自动迁移，适合小团队
- 校园后端 V1 非常简单：CRUD 内容 + 分类，不需要复杂架构

**Alternatives considered**:
- Express：老旧，TypeScript 支持不如 Hono
- Fastify：性能好但 Hono 更轻量且已在项目规划中

## Decision 3: 校园后端 API 设计

**Decision**: RESTful API，无认证，内容全公开。

**Rationale**:
- V1 不做用户登录（spec clarification 确认）
- 内容全公开访问，不需要 auth middleware
- 管理操作（内容 CRUD）V1 通过管理后台在 AI 前端完成，校园后端只提供读接口
- 后续版本加入认证时，在 Hono 中间件层添加即可

**API 端点**（V1）:
- `GET /api/categories` — 获取校园生活分类列表
- `GET /api/categories/:slug/articles` — 获取某分类下的文章列表
- `GET /api/articles/:id` — 获取文章详情
- `GET /api/articles?search=keyword` — 关键词搜索

## Decision 4: 共享代码提取策略

**Decision**: 使用 tsconfig paths 别名（`@shared/*`）+ 保留旧路径 re-export。

**Rationale**:
- 现有 AI 前端有大量 `import { ... } from '../utils/access'` 之类的引用
- 如果直接移动文件到 shared/，需要修改几十个 import 路径 → 高风险
- 改为：文件移动到 `shared/` 后，原路径保留一个 re-export 文件
- 新代码（校园前端）统一使用 `@shared/` 路径
- 后续逐步清理 re-export，不阻塞当前进度

**Alternatives considered**:
- 一步到位全部改 import 路径：改动量大，AI 前端回归风险高
- 不提取，校园前端直接 import 上层的代码：路径混乱，耦合度高

## Decision 5: 校园前端内容管理方案

**Decision**: 校园内容通过 AI 前端的后台管理创建，存储在校园后端数据库。

**Rationale**:
- 校园前端 V1 不做独立管理后台
- 站长在 AI 前端后台的内容管理中，选择 `face='campus-life'` + 分类
- AI 前端后台调校园后端 API 创建内容（管理操作走 API）
- 校园前端只调读接口
- 需要在校园后端 API 中加一个简单的管理密钥（环境变量），不对外暴露

**Alternatives considered**:
- 校园前端自带管理后台：违反 spec（暂不做独立管理后台）
- 直接操作数据库：没有审计记录，不安全
