# 盘根 · AI 指南针（PanGen AI Compass）

> 两站功能完全一致，仅内容不同

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](#许可证)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cffa.svg)](https://vitejs.dev/)

双前端平台：**校园生活面** + **全球 AI 工具面**，面向不同用户群，共享同一代码库。

---

## 功能亮点

| 功能 | 全球站 | 校园站 |
|------|--------|--------|
| 首页布局 | Hero + AI 搜索 + 领域切换器 | 完全一致 |
| AI 智能搜索 | 智谱 GLM-4-Flash | 完全一致（不同系统提示） |
| 普通搜索 | 关键词过滤 | 完全一致 |
| 领域切换器 | 影视创作/编程开发/通用办公 | 日常起居/成长提升/精明消费 |
| 文章页三栏布局 | 系列目录 + 正文 + TOC | 完全一致 |
| 方案生成/导出 | 支持 | 支持 |

---

## 技术栈

| 层级 | 技术 | 备注 |
|------|------|------|
| 语言 | TypeScript ~5.8 | 开启 strict mode |
| UI 框架 | React 19 | Concurrent 特性 |
| 构建 | Vite 6 | 双入口 |
| 样式 | Tailwind CSS 3 | PostCSS 管线 |
| 路由 | React Router v7 | |
| 状态 | Zustand 5 | 全局轻量状态 |
| 表单 | React Hook Form + Zod | 后台 & 创作者中心 |
| Markdown | react-markdown + rehype | sanitize 安全渲染 |
| AI 模型 | 智谱 GLM-4-Flash | 两站共用，通过 AI 网关 |
| 包管理 | pnpm（严格模式） | 需显式 React alias 去重 |

---

## 快速开始

### 前置条件

- Node.js（推荐 v18+）
- pnpm（`npm i -g pnpm`）

### 安装

```bash
pnpm install
```

### 开发

```bash
# 全球站前端
pnpm dev

# 校园站前端（另一个终端）
pnpm dev:campus
```

### 构建

```bash
pnpm build        # 全球站
pnpm build:campus # 校园站
```

### 配置 AI（可选）

本地演示模式下 AI 功能对游客开放。

```bash
# 方式1：.zhipu.local.json
echo '{"api_key": "your-key", "base_url": "https://open.bigmodel.cn"}' > .zhipu.local.json

# 方式2：.env.development.local
echo "ZHIPU_API_KEY=your-key" >> .env.development.local
```

---

## 项目结构

```
NorthStar/
├── pangen-ai-compass/     # 前端代码库
│   ├── src/
│   │   ├── components/    # 共享组件
│   │   ├── campus/        # 校园站专属
│   │   ├── global/        # 全球站专属
│   │   ├── utils/         # 工具函数
│   │   └── types/         # 类型定义
│   ├── vite.config.ts     # 全球站配置
│   └── vite.config.campus.ts  # 校园站配置
├── specs/                 # 规格文档
│   ├── PRD-盘根AI指南针-标准版.md  # 单一事实来源
│   └── [数字编号]-*/       # Feature specs
└── .specify/             # Spec Kit 宪法与模板
```

---

## 额度和限制

| 功能 | 每日次数 | 重置时间 |
|------|----------|----------|
| AI 搜索 | 3 次/天 | 每日 00:00 |
| AI 方案 | 3 次/天 | 每日 00:00 |

> 额度存于 localStorage，按本机时间重置。AI 搜索额度耗尽或服务异常会回退到"演示模式"。

---

## 安全说明

- 仅用于本地开发/演示。生产部署必须由后端网关持有并转发 API Key
- `.zhipu.local.json`、`.env.*.local` 已在 `.gitignore`，勿提交密钥

---

## 相关文档

- [PRD（单一事实来源）](specs/PRD-盘根AI指南针-标准版.md)
- [项目宪法](.specify/memory/constitution.md)
- [Spec Kit 使用指南](.specify/)

---

## 许可证

[UNLICENSED](https://choosealicense.com/no-permission/) — 内部项目，保留所有权利
