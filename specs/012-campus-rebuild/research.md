# Research: 校园站前端重建

**Branch**: `012-campus-rebuild` | **Date**: 2026-04-10

## R1: 校园站独立入口方案

**Decision**: Vite 多页应用（MPA）模式，通过 `rollupOptions.input` 配置双入口

**Rationale**:
- 校园站和全球站共享同一仓库和依赖，减少代码重复
- Vite MPA 天然支持独立 HTML 入口，每个入口可加载不同根组件
- 无需配置复杂的 monorepo 或 workspace

**Alternatives considered**:
- 独立仓库：增加维护成本，共享组件需发布 npm 包
- 微前端（Module Federation）：过度工程化，原型阶段不必要
- 条件渲染（同一入口内切换）：违反宪法原则十一"两个前端 MUST NOT 共享导航组件"

## R2: 校园站 AI 搜索实现

**Decision**: 复用全球站 AI 搜索架构（智谱 GLM-4-Flash + tool calling），仅替换系统提示为"校园生活顾问"

**Rationale**:
- 宪法原则十一规定两站功能完全一致，仅内容不同
- 智谱 GLM-4-Flash 为宪法规定模型，两站共用
- tool calling 机制（`emit_campus_result`）可精确控制返回结构
- AI 失败时自动降级到关键词搜索，保证可用性

**Alternatives considered**:
- 纯前端关键词搜索：违反 spec FR-004 要求的 AI 搜索
- OpenAI API：违反宪法原则二（前端不包含第三方 Key）和原则十一（合规要求国内提供商）

## R3: 校园站种子内容策略

**Decision**: 前端硬编码种子数据（Zustand store 内），67 篇文章覆盖 8 个分类

**Rationale**:
- 宪法原则一允许"前端原型阶段使用 localStorage + Mock 数据闭环体验"
- Zustand persist 自动持久化到 localStorage
- 硬编码种子数据无需后端，原型阶段零依赖

**Alternatives considered**:
- JSON 文件动态加载：增加异步复杂度，原型阶段无必要
- 后端 API 获取：后端尚未实现，会阻塞前端开发

## R4: 校园站内容领域设计

**Decision**: 使用 8 个分类（arrival, food, shopping, transport, admin, activity, secondhand, pitfalls），暂不实施 3 领域重构

**Rationale**:
- 3 领域重构（日常起居/成长提升/精明消费）属于 003-campus-mirror-global 范畴
- 012-campus-rebuild 聚焦基础重建：独立入口 + AI 搜索 + 种子内容
- 8 分类已足够覆盖校园生活场景

**Alternatives considered**:
- 直接实施 3 领域：范围蔓延，与 003 spec 重叠
- 使用全球站 3 领域（creative/dev/work）：内容不匹配校园场景

## R5: 种子内容数据量

**Decision**: 67 篇文章 + 8 个专题（部分分类未达 10 篇目标）

**Rationale**:
- 已完成分类：activity(7), admin(11), arrival(10), food(10), pitfalls(9) 达标
- 未达标分类：transport(5), secondhand(7), shopping(8) 需后续补充
- 宪法原则四要求每领域 ≥10 篇才开放，未达标分类应展示 Locked 态

**Alternatives considered**:
- 全部达标再发布：阻塞验证周期，与 Cat Wu"快速实验"方法论冲突
- AI 批量生成：质量不可控，需要人工审校
