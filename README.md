# 盘根 · AI 指南针（PanGen AI Compass）

> 成为自己 — 校园站帮你站稳脚下，全球站帮你看见远方

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

双前端 + 单后端架构：**校园站**（xyzidea.cn）+ **全球站**（xyzidea.com），共享 `@ns/shared` 跨产品代码，各自独立构建。

---

## 功能亮点

| 功能       | 说明                                         |
| -------- | ------------------------------------------ |
| AI 智能搜索  | 智谱 GLM-4-Flash，输入问题返回摘要 + 推荐工具 + 推荐文章      |
| 方案生成     | 选工具 → 描述目标 → AI 生成操作步骤 → 保存/导出（md/txt/csv） |
| 校园 AI 顾问 | 校园站使用"校园生活顾问"角色，回答校园生活问题                   |
| 工具展览     | 全球站精选工具沉浸式展示（com 站独有）                      |
| 内容管理     | 管理后台支持文章/专题/工具/资讯的 CRUD + 审核 + 数据分析        |
| 敏感词管控    | 输入拦截 + 输出过滤，敏感词库共享于 `@ns/shared`           |

---

## 技术栈

| 层级    | 技术                   | 说明                      |
| ----- | -------------------- | ----------------------- |
| 语言    | TypeScript 5.8       | strict mode             |
| 前端框架  | React 19             | Concurrent 特性           |
| 构建    | Vite 6               | 双站各自独立 Vite 实例          |
| 样式    | Tailwind CSS 3       | —                       |
| 路由    | React Router v7      | —                       |
| 状态管理  | Zustand 5            | localStorage 持久化（原型阶段）  |
| AI 模型 | 智谱 GLM-4-Flash       | Vite proxy 转发，生产环境走后端网关 |
| 后端    | Hono + Drizzle + Zod | 待建                      |
| 包管理   | pnpm workspace       | monorepo                |

---

## 快速开始

### 前置条件

- Node.js >= 18
- pnpm >= 9

### 安装

```bash
cd NorthStar && pnpm install
```

### 开发

```bash
# 全球站
cd NorthStar/packages/frontai-web && pnpm dev     # http://localhost:3000

# 校园站（待重建）
# cd NorthStar/packages/frontlife-web && pnpm dev  # http://localhost:3001
```

### 配置 AI（可选）

本地演示模式下 AI 功能对游客开放。在对应 web 包目录下创建：

```bash
# frontai-web/.zhipu.local.json
echo '{"api_key": "your-key", "base_url": "https://open.bigmodel.cn"}' > NorthStar/packages/frontai-web/.zhipu.local.json
```

---

## 项目结构

```
NS/
├── CLAUDE.md                    # AI 开发指南
├── specs/                       # 规格文档
│   ├── PRD-盘根AI指南针-标准版.md
│   ├── implementation/specs.md
│   └── ui-prompts.md
│
└── NorthStar/                   # 所有代码
    ├── pnpm-workspace.yaml
    ├── tsconfig.base.json
    └── packages/
        ├── shared/              # @ns/shared — 跨产品共享（纯 TS）
        ├── frontai-web/         # 全球站（xyzidea.com）→ localhost:3000
        ├── frontlife-web/       # 校园站（xyzidea.cn）→ localhost:3001（待重建）
        └── server/              # @ns/server — 后端（待建）
```

---

## 文档索引

| 文档                                      | 说明                    |
| --------------------------------------- | --------------------- |
| [PRD v2.0](specs/PRD-盘根AI指南针-标准版.md)    | 产品需求文档，单一事实来源         |
| [实现规格](specs/implementation/specs.md)   | 数据模型、API 契约、认证流程、部署配置 |
| [项目宪法](.specify/memory/constitution.md) | 开发决策的最高约束文件           |
| [项目现状](STATUS.md)                       | 全站内容、数据、开发进度总览        |

---

## 安全说明

- 本项目仅用于本地开发/演示
- 生产部署**必须**由后端网关持有并转发 API Key
- `.zhipu.local.json`、`.env.*.local` 已在 `.gitignore`，勿提交密钥

---

## 许可证

[Apache License 2.0](LICENSE)
