# Implementation Plan: 国内站对齐全球站内容组织

**Branch**: `002-campus-align-global` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-campus-align-global/spec.md`

## Summary

将国内站（校园生活）从当前的两级内容结构（Category → Article）升级为三级结构（Category → Topic → Article），对齐全球站的内容组织能力。具体包括：首页添加本地搜索、新增专题数据模型与种子数据、首页和分类页展示专题卡片、文章页支持三栏布局（系列目录 + 正文 + TOC）、分类页添加排序切换器。

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19
**Primary Dependencies**: Zustand 5（状态管理）、React Router v7（路由）、Tailwind CSS 3（样式）、lucide-react（图标）
**Storage**: localStorage（Zustand persist，原型阶段种子数据）
**Testing**: 手动验证（原型阶段，无自动化测试框架）
**Target Platform**: 桌面 Chrome + 移动端 Safari/Chrome
**Project Type**: Web 前端应用（校园站，独立于全球站）
**Performance Goals**: 纯前端搜索 1 秒内返回结果；三栏布局首屏无闪烁
**Constraints**: 不修改全球站任何文件；不修改路由（页面不变，内容更丰富）；不写兼容代码
**Scale/Scope**: 8 篇种子文章 → 扩展为 2-3 个专题 + 8 篇文章；4 个页面文件修改

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| 一、技术栈不变量 | ✅ 通过 | React 19 + Vite + Tailwind + Zustand，无偏离 |
| 二、安全与密钥不变量 | ✅ 通过 | 纯前端本地搜索，无 API Key，无网络请求 |
| 三、文档与语言不变量 | ✅ 通过 | 文档中文，变量英文驼峰 |
| 四、产品体验不变量 | ✅ 通过 | 搜索框为渐进披露，专题卡片为主路径引导，排序切换无仪式感 |
| 五、多端交付不变量 | ✅ 通过 | 仅 Web 端，移动端适配底线满足（触控 ≥ 44px） |
| 六、功能阶段化不变量 | ✅ 通过 | 搜索、专题均为渐进增强，不影响核心阅读 |
| 七、内容与文档标准不变量 | ✅ 通过 | 内容格式仍为 Markdown |
| 八、后台与协作不变量 | ✅ 通过 | 不涉及后台 |
| 九、本地存储不变量 | ✅ 通过 | Zustand persist 已有原子写入 + guard |
| 十、参考规格与单一事实来源 | ✅ 通过 | 规格对齐 PRD v1.5 §8.2.3 |
| 十一、双面架构不变量 | ✅ 通过 | 仅修改校园站文件，不修改全球站文件，不共享导航组件 |

**结论**: 全部通过，无违规项。

## Project Structure

### Documentation (this feature)

```text
specs/002-campus-align-global/
├── spec.md              # 功能规格
├── plan.md              # 本文件（实施计划）
├── research.md          # Phase 0 研究记录
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速启动
├── checklists/          # 质量检查清单
└── tasks.md             # Phase 2 任务清单（/speckit.tasks 生成）
```

### Source Code (repository root)

```text
NorthStar/pangen-ai-compass/src/
├── campus/
│   ├── CampusApp.tsx              # 修改：可能调整宽度
│   ├── constants.ts               # 不修改
│   ├── routes.tsx                 # 不修改
│   ├── store.ts                   # 修改：新增 CampusTopic、store 方法
│   └── pages/
│       ├── CampusHomePage.tsx     # 修改：搜索框 + 专题卡片
│       ├── CategoryPage.tsx       # 修改：专题区域 + 排序切换器
│       └── CampusArticlePage.tsx  # 修改：三栏布局
├── components/
│   └── DocRenderer/               # 共享组件，不修改
├── utils/
│   └── docMarkdown.ts             # 共享工具，不修改
└── types/                         # 共享类型，不修改
```

**Structure Decision**: 现有校园前端结构不变，仅修改 store.ts 和 3 个页面组件。全球站文件完全不触碰。

## Complexity Tracking

> 无违规项，此表留空。
