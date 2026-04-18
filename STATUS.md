# 盘根·AI 指南针 — 项目现状

> 更新时间：2026-04-18
> 版本：v0.1.0
> 分支：main

## 产品定位

> **一半生活，一半理想**
> - 校园站（xyzidea.cn）：帮大学生过好校园生活
> - 全球站（xyzidea.com）：帮所有人用好 AI 工具

---

## 站点一：全球站 FrontAI（xyzidea.com）

### 为谁

想用 AI 工具但不知道从哪下手的人——学生、自由职业者、职场新人

### 内容是什么

AI 工具导航 + 实操教程，按三个领域组织：

| 领域 | 名称 | 内容 |
|---|---|---|
| creative | 影视创作 | AI 视频/图像生成（Midjourney、Runway） |
| dev | 编程开发 | 代码助手与开发工具（Cursor） |
| work | 通用办公 | 文档、PPT、效率工具（Gamma、Notion AI） |

现有种子数据：

- **6 个工具**：Cursor、Midjourney、Gamma、V0.dev、Runway Gen-3、Notion AI
- **2 个专题**：Git 版本管理实战、短视频创作全流程
- **4 篇教程**：Cursor 实战、Midjourney 角色生成、Gamma PPT、Git 分支管理

### 为什么停下来看

不是工具列表页，是"我用了这个工具踩了什么坑、怎么用最快上手"的实战经验

### 开发状态

可运行，localhost:3000，67 个源文件，tsc 编译通过

---

## 站点二：校园站 FrontLife（xyzidea.cn）

### 为谁

在校大学生，尤其是大一新生——刚到校园，什么都不懂什么都想知道

### 内容是什么

同学写的真实校园生活经验，按 8 分类 + 3 展示领域组织：

| 展示领域 | 包含分类 | 文章数 |
|---|---|---|
| 日常起居 | 新生报到(10)、吃(10)、出行(5) | 25 |
| 成长提升 | 办事(11)、活动(7) | 18 |
| 精明消费 | 买(8)、二手(7)、避坑(9) | 24 |

**8 个种子专题**：新生报到全攻略、校园省钱指南、校园美食地图、校园出行指南、社团活动大全、校园避坑指南、二手交易指南、教务办理攻略

**~67 篇种子文章**（每篇含标题/摘要/完整 markdown 正文），覆盖食堂测评、选课避坑、二手教材、社团实评等

### 为什么停下来看

同校学长学姐写的，不是泛泛之谈，每篇都是"我踩过的坑你别踩"，信息密度高、跟自己直接相关

### 开发状态

代码已删除，数据保存在 `@ns/shared`。等待重建

---

## 共享层 @ns/shared

| 文件 | 内容 |
|---|---|
| types.ts | 全部基础类型（30+ 接口/类型/枚举） |
| api.ts | API 端点常量 |
| ai-contract.ts | AI 搜索结果类型 + FallbackReason（含 sensitive_blocked/output） |
| ai-utils.ts | JSON 解析等工具函数 |
| sensitive.ts | 敏感词管控（6 类词库 + 检测函数） |
| frontlife-constants.ts | 校园站 8 分类定义 + 3 领域映射 + 辅助函数 |
| frontlife-seed.ts | 校园站种子数据（8 专题 + 67 篇文章，纯数据无 UI 依赖） |

编译通过，无外部依赖（纯 TypeScript）

---

## 后端 @ns/server

空壳，仅 package.json，待建

---

## 目录结构

```
NS/
├── CLAUDE.md                   # AI 开发指南
├── AGENTS.md                   # Agent 指南
├── README.md                   # 项目介绍
├── STATUS.md                   # 本文件
├── product_planning.md         # 产品规划（参考策略）
├── .gitignore
├── .specify/                   # 宪法层
│   └── memory/constitution.md
├── specs/                      # 规格文档
│   ├── PRD-盘根AI指南针-标准版.md
│   └── implementation/specs.md
│
└── NorthStar/                  # 所有代码
    ├── pnpm-workspace.yaml
    ├── tsconfig.base.json
    └── packages/
        ├── shared/             # @ns/shared — 跨产品共享（纯 TS）
        ├── frontai-web/        # 全球站 → localhost:3000
        └── server/             # @ns/server — 后端（空壳待建）
```

---

## Git 状态

- 当前分支：`main`
- 标签：`v0.1.0`（monorepo 重构完成）
- 未提交变更：删除 frontlife-web + 修复 shared 编译

## 待办

- [ ] 提交当前未提交变更
- [ ] 重建校园站 frontlife-web
- [ ] 搭建后端 @ns/server
