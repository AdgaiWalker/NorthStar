# Quickstart: 双面前端开发指南

## 前置条件

- Node.js 20+
- pnpm 10+
- PostgreSQL 16+（校园后端）

## 启动开发环境

### AI 前端（现有，零改动）

```bash
cd pangen-ai-compass
pnpm dev
# 访问 http://localhost:5173
```

### 校园前端（新增）

```bash
# 终端 1：启动校园后端
cd campus-server
pnpm install
pnpm dev
# 后端运行在 http://localhost:3001

# 终端 2：启动校园前端
cd pangen-ai-compass
pnpm dev:campus
# 前端运行在 http://localhost:5174
```

## 构建产物

```bash
# 构建 AI 前端 → 部署到 xyzidea.com
pnpm build:ai
# 产物在 dist/ai/

# 构建校园前端 → 部署到 xyzidea.cn
pnpm build:campus
# 产物在 dist/campus/
```

## 关键文件路径

| 文件 | 用途 |
|------|------|
| `vite.config.ts` | AI 前端 Vite 配置 |
| `vite.config.campus.ts` | 校园前端 Vite 配置 |
| `campus.html` | 校园前端 HTML 入口 |
| `src/campus-main.tsx` | 校园前端 React 入口 |
| `src/campus-routes.tsx` | 校园前端路由定义 |
| `src/shared/` | 两端共享代码 |
| `campus-server/` | 校园后端（Hono + Prisma + PostgreSQL） |

## 开发规范

1. **共享代码修改**：必须确认两端都不受影响
2. **AI 前端代码**：随意修改，不影响校园前端
3. **校园前端代码**：随意修改，不影响 AI 前端
4. **import 路径**：
   - 共享代码用 `@shared/xxx`（tsconfig paths 配置）
   - AI 专用代码用相对路径
   - 校园专用代码用相对路径
