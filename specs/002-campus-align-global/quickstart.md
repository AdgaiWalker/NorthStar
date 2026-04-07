# Quickstart: 国内站对齐全球站内容组织

**Feature**: 002-campus-align-global
**Date**: 2026-04-08

## 前置条件

- Node.js 18+
- pnpm 已安装
- 项目依赖已安装（`pnpm install`）

## 启动校园站开发服务器

```bash
cd NorthStar/pangen-ai-compass
pnpm dev:c campus
```

校园站默认运行在 `http://localhost:3001`（或 vite.config.campus.ts 中配置的端口）。

## 验证步骤

### 1. 首页搜索

1. 打开校园站首页
2. 在搜索框输入"食堂"
3. 验证：显示匹配文章卡片，分类入口隐藏
4. 清空搜索框
5. 验证：恢复分类入口 + 热门内容

### 2. 专题卡片

1. 首页滚动到分类入口下方
2. 验证：可见"专题推荐"区域，显示 2 个 TopicCard
3. 点击 TopicCard 进入专题内第一篇文章

### 3. 分类页排序

1. 点击任意分类（如"吃"）
2. 验证：面包屑 + 分类描述 + 专题卡片（如有）+ 文章列表
3. 点击"最新"排序标签
4. 验证：文章列表按时间排列
5. 点击"热门"排序标签
6. 验证：文章列表按浏览量排列

### 4. 三栏文章页

1. 打开属于专题的文章（如"新生报到清单"）
2. 验证：三栏布局 — 系列目录（左）+ 正文（中）+ TOC（右）
3. 点击系列目录中的另一篇文章
4. 验证：跳转到新文章，系列目录更新高亮

### 5. 独立文章页

1. 打开不属于任何专题的文章（如"千万别办校园门口的理发卡"）
2. 验证：两栏布局 — 正文（左/中）+ TOC（右）
3. 验证：无左侧系列目录

### 6. 全球站无影响

1. 打开全球站 `http://localhost:3000`
2. 验证：所有页面功能正常，无任何变化

## 修改文件清单

| 文件 | 改动类型 |
|---|---|
| `src/campus/store.ts` | 新增 CampusTopic 类型、种子专题、store 方法；CampusArticle 新增 topicId |
| `src/campus/pages/CampusHomePage.tsx` | 添加搜索框 + 专题卡片区域 |
| `src/campus/pages/CategoryPage.tsx` | 添加专题区域 + 排序切换器 |
| `src/campus/pages/CampusArticlePage.tsx` | 三栏布局（有专题时显示左侧系列目录）|
