# Implementation Plan: 校园站前端重建

**Branch**: `012-campus-rebuild` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-campus-rebuild/spec.md`

## Summary

校园站前端重建：创建独立的校园站入口（campus.html）、校园站应用壳（CampusApp.tsx）、校园站 AI 搜索（"校园生活顾问"角色）、种子内容填充（67 篇文章、8 个专题）。校园站与全球站共享前端代码仓库，通过 Vite 多页配置区分入口，内容完全独立。

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19
**Primary Dependencies**: Zustand 5（状态管理）、React Router v7（路由）、Tailwind CSS 3（样式）、lucide-react（图标）、react-markdown（Markdown 渲染）
**Storage**: localStorage（Zustand persist，原型阶段种子数据）
**Testing**: 手动验证（原型阶段，无自动化测试框架）
**Target Platform**: 桌面 Chrome + 移动端 Safari/Chrome
**Project Type**: Web 前端应用（校园站，独立于全球站）
**Performance Goals**: AI 搜索 3s 内返回结果；本地搜索 1s 内返回
**Constraints**: 不修改全球站任何文件；不共享导航组件（宪法原则十一）；校园站 AI 调用通过 Vite proxy 转发
**Scale/Scope**: 67 篇种子文章、8 个种子专题、3 个页面、1 个 AI 搜索组件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| 一、技术栈不变量 | ✅ 通过 | TypeScript 5.8 + React 19 + Vite 6 + Tailwind 3 + Zustand 5，完全合规 |
| 二、安全与密钥不变量 | ✅ 通过 | 前端不包含 API Key，通过 Vite proxy 转发，代理配置在 vite.config.ts |
| 三、文档与语言不变量 | ✅ 通过 | 文档中文，变量英文驼峰 |
| 四、产品体验不变量 | ✅ 通过 | 搜索框为渐进披露，专题卡片为主路径引导，排序切换无仪式感 |
| 五、多端交付不变量 | ✅ 通过 | 仅 Web 端，移动端适配底线满足（触控 ≥ 44px） |
| 六、功能阶段化不变量 | ✅ 通过 | 校园站内容不足时展示 Locked 态（宪法原则要求 ≥10 篇/领域才开放） |
| 七、内容与文档标准不变量 | ✅ 通过 | 种子内容为 Markdown 格式 |
| 八、后台与协作不变量 | ✅ 通过 | 不涉及后台 |
| 九、本地存储不变量 | ✅ 通过 | Zustand persist 已有原子写入 + guard（数据损坏自动重置） |
| 十、参考规格与单一事实来源 | ✅ 通过 | 规格对齐 PRD v1.8 §2.2 + product_planning.md 原型 2 |
| 十一、双面架构不变量 | ✅ 通过 | campus.html + vite.config.ts 双入口，校园站独立 BrowserRouter，不共享导航组件，站间链接遵循规则 |

**结论**: 全部通过，无违规项。

## Project Structure

### Documentation (this feature)

```text
specs/012-campus-rebuild/
├── spec.md              # 功能规格
├── plan.md              # 本文件（实施计划）
├── research.md          # Phase 0 研究记录
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速启动
└── checklists/          # 质量检查清单
```

### Source Code (repository root)

```text
NorthStar/pangen-ai-compass/
├── campus.html                          # 校园站入口（新增）
├── vite.config.ts                       # 多页构建配置（修改）
├── src/
│   ├── campus/                          # 校园站代码（独立目录）
│   │   ├── CampusApp.tsx                # 应用壳（Header + 路由 + Footer）
│   │   ├── routes.tsx                   # 路由定义
│   │   ├── constants.ts                 # 分类定义（8 个校园分类）
│   │   ├── store.ts                     # Zustand store + 种子数据
│   │   ├── pages/
│   │   │   ├── CampusHomePage.tsx       # 首页（Hero + 搜索 + 分类入口 + 专题 + 热门）
│   │   │   ├── CategoryPage.tsx         # 分类页（专题 + 文章列表 + 排序）
│   │   │   └── CampusArticlePage.tsx    # 文章页（三栏/两栏布局）
│   │   ├── components/
│   │   │   └── CampusAISearch.tsx       # AI 搜索组件
│   │   └── services/
│   │       └── campusAIService.ts       # AI 搜索服务（智谱 GLM-4-Flash）
│   ├── components/                      # 全球站组件（不修改）
│   └── constants/
│       ├── api.ts                       # API 端点配置（共享）
│       └── ui.ts                        # UI 延迟常量（共享）
```

**Structure Decision**: 校园站代码完全独立于全球站，位于 `src/campus/` 目录。仅共享 API 端点配置和 UI 常量。两站通过 Vite 多页构建共享同一产物目录。

## Complexity Tracking

> 无违规项，此表为空。
