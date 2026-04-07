# Implementation Plan: 校园生活与 AI 工具前端剥离

**Branch**: `001-dual-face-architecture` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)

## Summary

将现有单体前端 `pangen-ai-compass` 拆分为两个独立前端入口：
- **AI 前端**（`xyzidea.com`，海外）：保留现有全部功能，零改动
- **校园前端**（`xyzidea.cn`，国内）：新增 Vite 入口，提供 8 个分类内容浏览 + 阅读页
- **共享层**：DocRenderer、access policy、types、utils 等前端代码复用
- **校园后端**：Node.js + PostgreSQL，V1 内容全公开，无用户登录

## Technical Context

| 项目 | 值 |
|------|---|
| 语言 | TypeScript 5.x |
| 前端框架 | React 19 |
| 构建 | Vite 6（多入口模式） |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand 5 |
| 路由 | React Router v7 |
| 校园后端 | Node.js + Hono.js + Prisma + PostgreSQL |
| AI 前端后端 | V1 无后端（localStorage + mock） |
| 包管理 | pnpm |
| 校园部署 | xyzidea.cn（国内服务器 + ICP 备案） |
| AI 部署 | xyzidea.com（海外服务器） |
| 测试 | V1 手动验收 |

## Constitution Check

| 原则 | 合规 | 说明 |
|------|------|------|
| 一、技术栈 | ✅ | TypeScript + React + Vite + Tailwind + Zustand 均不变 |
| 二、安全密钥 | ✅ | 校园前端不调任何 AI API；AI 前端密钥规则不变 |
| 三、文档语言 | ✅ | 中文文档 + 英文标识符 |
| 四、产品体验 | ✅ | 校园前端遵循最短主路径、渐进披露 |
| 五、多端交付 | ✅ | 校园前端同样遵循响应式设计 + 移动端底线 |
| 六、Feature Flags | ✅ | 校园前端 V1 无需 Feature Flag（功能集固定） |
| 七、内容格式 | ✅ | 校园内容统一 Markdown + 受控块 |
| 八、后台协作 | ✅ | 后台保留在 AI 前端，审核流程不变 |
| 九、本地存储 | ✅ | 校园前端 V1 不用 localStorage（从后端读） |

**结论**: 全部合规，无需违规记录。

## Project Structure

### 最终目录结构

```text
pangen-ai-compass/
├── index.html                    # AI 前端入口（现有，不改）
├── campus.html                   # 校园前端入口（新增）
├── vite.config.ts                # AI 前端 Vite 配置（现有，微调）
├── vite.config.campus.ts         # 校园前端 Vite 配置（新增）
├── package.json                  # 新增 campus dev/build 脚本
│
├── src/
│   ├── main.tsx                  # AI 前端启动入口（现有，不改）
│   ├── campus-main.tsx           # 校园前端启动入口（新增）
│   ├── routes.tsx                # AI 前端路由（现有，不改）
│   ├── campus-routes.tsx         # 校园前端路由（新增）
│   │
│   ├── shared/                   # 共享层（从现有代码提取，不改功能）
│   │   ├── components/
│   │   │   ├── DocRenderer.tsx
│   │   │   ├── CardComponents.tsx
│   │   │   └── ui/
│   │   ├── utils/
│   │   │   ├── access.ts
│   │   │   ├── storage.ts
│   │   │   ├── guards.ts
│   │   │   ├── docMarkdown.ts
│   │   │   ├── wikilink.ts
│   │   │   └── export.ts
│   │   ├── types/
│   │   │   └── index.ts          # ContentItem 等共享类型
│   │   ├── constants/
│   │   │   └── campus.ts         # 校园分类定义
│   │   └── hooks/
│   │       └── useShare.ts
│   │
│   ├── ai/                       # AI 前端专用（现有页面移动至此）
│   │   ├── pages/
│   │   ├── components/
│   │   │   ├── AISearch.tsx
│   │   │   ├── FloatingDock.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   └── store/
│   │
│   └── campus/                   # 校园前端专用（新增）
│       ├── pages/
│       │   ├── CampusHomePage.tsx
│       │   ├── CategoryPage.tsx
│       │   └── CampusArticlePage.tsx
│       ├── components/
│       │   ├── CategoryGrid.tsx
│       │   └── ContentCard.tsx
│       ├── services/
│       │   └── campusApi.ts
│       └── store/
│           └── useCampusStore.ts
│
├── campus-server/                # 校园后端（新增）
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
└── ...
```

### 共享层提取策略

**不移动代码，用 re-export 保持兼容：**

```text
src/shared/utils/access.ts     ← 现有 src/utils/access.ts 移动
src/shared/types/index.ts      ← 现有 src/types.ts 移动
...

AI 前端的旧引用路径不变：
  src/utils/access.ts → re-export from src/shared/utils/access.ts
  或通过 tsconfig paths 别名统一
```

**最小改动方案**：使用 `tsconfig.json` 的 `paths` 配置，让 `@shared/*` 指向共享层，旧代码的相对路径引用不需要全部改。

## Complexity Tracking

无需记录——宪法检查全部通过。
