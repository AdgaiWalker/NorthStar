# 盘根（PanGen）

> 一半生活，一半理想。校园站帮你站稳脚下，全球站帮你看见远方。

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

双前端 + 单后端：**校园站**（xyzidea.cn）+ **全球站**（xyzidea.com），共享 `@ns/shared`，各自独立构建。

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + Tailwind CSS 3 + Zustand 5 | 双站独立构建 |
| 后端 | Hono + Drizzle ORM + PostgreSQL | 校园站 API 已接入 |
| AI | 智谱 GLM-4-Flash | 后端代理，前端不持有 key |
| 开发 | Claude Code（AI 辅助） | |
| 测试 | Vitest | |
| 包管理 | pnpm workspace | monorepo |

---

## 快速开始

```bash
cd NorthStar && pnpm install

# 全球站
cd NorthStar/packages/frontai-web && pnpm dev     # http://localhost:3000
```

### 校园站启动方式

#### 1. Mock 模式

```bash
cd NorthStar/packages/frontlife-web
pnpm dev   # http://localhost:3001
```

默认使用前端 mock 数据，适合纯页面开发和样式联调。

#### 2. 真实 API 模式

```bash
cd NorthStar/packages/server
pnpm db:push
pnpm db:seed
pnpm start   # http://localhost:4000
```

PowerShell 下启动真实 API 前端：

```powershell
cd E:\桌面\NS\NorthStar\packages\frontlife-web
$env:VITE_USE_MOCK='false'
pnpm dev   # http://localhost:3001
```

### Mock / API 切换规则

- `VITE_USE_MOCK=true`：校园站走 `src/services/mockApi.ts`
- `VITE_USE_MOCK=false`：校园站走 `/api/*`，由 Vite proxy 转发到 `http://localhost:4000`
- 全球站 AI 入口统一走 `/api/ai/tools`

### AI 本地配置

```bash
echo '{"api_key":"your-key","base_url":"https://open.bigmodel.cn"}' > NorthStar/.zhipu.local.json
```

---

## 项目结构

```
NS/
├── CLAUDE.md                        # AI 开发指南（权威）
├── specs/                           # 规格文档
│   ├── MISSION.md                   # 使命
│   ├── PRD-盘根校园-v9.md            # 校园站 PRD（v9.0）
│   ├── PRD-盘根AI指南针-标准版.md     # 全球站 PRD
│   ├── dev-plan.md                  # 研发方案（五层 58 项任务）
│   ├── implementation/specs.md      # 全球站实现规格
│   └── meetings/                    # 产品委员会会议纪要
│
└── NorthStar/                       # 所有代码
    ├── pnpm-workspace.yaml
    └── packages/
        ├── shared/                  # @ns/shared — 纯 TS 共享包
        ├── frontlife-web/           # 校园站 → localhost:3001
        ├── frontai-web/             # 全球站 → localhost:3000
        └── server/                  # @ns/server — Hono + Drizzle API
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [宪法](.specify/memory/constitution.md) | 最高约束（五条公理） |
| [使命](specs/MISSION.md) | 使命和方向 |
| [校园站 PRD v9](specs/PRD-盘根校园-v9.md) | 校园站完整产品需求 |
| [全球站 PRD](specs/PRD-盘根AI指南针-标准版.md) | 全球站产品需求 |
| [研发方案](specs/dev-plan.md) | 五层递进，58 项任务，6-8 周排期 |
| [发布收口清单](specs/release-checklist-v0.3.1.md) | v0.3.1 发布前验收与收口 |
| [试用任务](specs/usability-tasks-v0.3.1.md) | 下一轮真人试用任务模板 |
| [全球站实现规格](specs/implementation/specs.md) | 数据模型、API 契约、认证流程 |
| [第七次会议](specs/meetings/meeting-07-architecture.md) | 架构设计（Evan You 主导） |
| [第八次会议](specs/meetings/meeting-08-dev-plan.md) | 研发方案（Pieter Levels 主导） |

文档层级：**宪法 → 使命 → PRD → 实现规格**。冲突时以上层为准。

---

## 安全

- 生产部署必须由后端网关持有并转发 API Key
- `.zhipu.local.json`、`.env.*.local` 已在 `.gitignore`，勿提交密钥
- cn 用户数据不流向海外；com 站禁止收集中国敏感个人信息
- 两站账号体系完全独立

---

## 许可证

[Apache License 2.0](LICENSE)
