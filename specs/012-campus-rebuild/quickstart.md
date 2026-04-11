# Quickstart: 校园站前端重建

**Branch**: `012-campus-rebuild` | **Date**: 2026-04-10

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- 智谱 AI API Key（开发环境，配置在 `.env.local`）

## Setup

```bash
cd NorthStar/pangen-ai-compass
pnpm install
```

## Development

```bash
# 启动开发服务器（同时支持全球站和校园站）
pnpm dev

# 访问全球站：http://localhost:3000
# 访问校园站：http://localhost:3000/campus.html
```

## Build

```bash
pnpm build
# 产物在 dist/ 目录：
#   dist/index.html     → 全球站
#   dist/campus.html     → 校园站
```

## File Map

| 功能 | 文件路径 |
|------|---------|
| 校园站入口 | `campus.html` |
| 应用壳 | `src/campus/CampusApp.tsx` |
| 路由 | `src/campus/routes.tsx` |
| 首页 | `src/campus/pages/CampusHomePage.tsx` |
| 分类页 | `src/campus/pages/CategoryPage.tsx` |
| 文章页 | `src/campus/pages/CampusArticlePage.tsx` |
| AI 搜索组件 | `src/campus/components/CampusAISearch.tsx` |
| AI 搜索服务 | `src/campus/services/campusAIService.ts` |
| Store + 种子数据 | `src/campus/store.ts` |
| 分类定义 | `src/campus/constants.ts` |

## 6-Step Verification

1. **校园站首页** — 访问 `/campus.html`，确认显示校园站内容（非全球站）
2. **AI 搜索** — 输入"学校附近有什么好吃的"，确认返回校园文章推荐
3. **本地搜索** — 在首页搜索框输入"食堂"，确认实时过滤匹配文章
4. **分类浏览** — 点击分类入口（如"吃"），确认分类页正常显示
5. **文章阅读** — 打开一篇文章，确认两栏/三栏布局正常
6. **全球站回归** — 访问 `/`（全球站），确认无报错、功能正常

## Known Issues

- 部分分类未达 10 篇目标：transport(5), secondhand(7), shopping(8)
- 种子数据中有 2 个重复文章 ID（campus-b4, campus-b13）
- 校园站尚未实施 3 领域重构（属于 003-campus-mirror-global）
