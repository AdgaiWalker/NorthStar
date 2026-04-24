# v0.3.1 验收与收口 TODO

> 目标：把校园站从“开发可运行”推进到“可发布、可试用、可继续收口”。
> 规则：中文优先；无显性要求不写兼容代码；UI 图标统一使用 Lucide，不使用 emoji 做界面图标。

## 全量 PRD 起点说明

- [x] 当前 `v0.3.1` 不是两份 PRD 全量完成版本，而是全量 PRD 的平台化起点。
- [x] 已记录平台地基基线：[full-prd-baseline-v0.3.1-p0.md](./full-prd-baseline-v0.3.1-p0.md)
- [x] 已记录后续全量实施计划：[full-prd-next-implementation-plan.md](./full-prd-next-implementation-plan.md)
- [x] 旧校园 API、全球站 mock、后台 placeholder 均标记为后续替换对象，不新增桥接层。
- [x] 后续注册登录以用户名 + 邮箱 + 密码为准，不做手机号/SMS 分支。
- [x] P0 平台地基提交只声明“平台地基”，不声明“全量 PRD 完成”。

## 全量 PRD P0 平台闭环记录

- [x] `identity` 已补最小闭环：用户名/邮箱登录、邮箱验证 token、密码重置 token、`tokenInvalidBefore` 失效机制、`/api/identity/me`。
- [x] `compliance` 已补最小闭环：协议/隐私政策公开查询、consent 记录、本人数据导出、注销申请、后台处理注销并失效旧 token。
- [x] `moderation` 已接真实入口：举报和“有变化”反馈会创建审核任务，审核状态变化写入审计日志。
- [x] `admin-console` 已接真实登录和真实 API：登录、站点切换、审核队列/详情、用户管理、内容管理、审计日志、系统配置。
- [x] `/api/admin/*` 已限制为 `reviewer/operator/admin`，普通用户不能进入后台接口。
- [x] seed 已补 `cn/com` 默认协议和隐私政策，并新增后台管理员种子账号。
- [ ] 全球站申请审核、AI 输出抽检进入 moderation 尚未完成，进入下一批 P1/P2。

## P0：发布前必须完成

- [x] P0-1 吸收当前工作区 WIP 并补最终验证
  - [x] 吸收前端错误态 / 空态 / seed 重置 / 测试补强改动
  - [x] `frontlife-web` 测试通过（18/18）
  - [x] `frontlife-web` lint 通过
  - [x] `frontlife-web` TypeScript `--noEmit` 通过
  - [x] `server` 测试通过（13/13）
  - [x] `server` TypeScript `--noEmit` 通过
  - [x] 真实 API smoke 通过

- [x] P0-2 登录过期 / `401` 统一处理
  - [x] API 客户端统一把 `401` 转成“登录状态已失效，请重新登录。”
  - [x] 清空本地登录态与权限缓存
  - [x] 清空通知状态
  - [x] 读取型场景保留当前页面，并显示全局去登录路径
  - [x] 写操作场景直接跳登录页
  - [x] 登录页支持显示“登录状态已失效，请重新登录。”

- [x] P0-3 文档同步
  - [x] README 补齐真实 API 启动方式
  - [x] README 明确 mock / API 切换方式
  - [x] 新增 v0.3.1 试用任务文档
  - [x] 回写本轮验收结果与包体记录

- [ ] P0-4 发布动作
  - [ ] Lore 协议 commit
  - [ ] push `origin main`
  - [ ] 打 `v0.3.1` 标签
  - [ ] push tag

## P1：稳定性增强

- [x] P1-1 错误态与空数据态
  - [x] server 断开时前端不白屏
  - [x] 首页 / 搜索 / 探索 / 空间 / 文章 / 我的页均有中文错误提示
  - [x] 空空间、空文章、空帖子、空通知、暂无个人内容有可读展示
  - [x] API 异常不再静默吞掉

- [x] P1-2 AI 降级专项
  - [x] 校园站 `/api/ai/search` 在无 AI key 时仍返回可读 fallback
  - [x] 校园站 `/api/ai/write` 在无 AI key 时仍返回可编辑草稿
  - [x] 全球站 `/api/ai/tools` 在无 AI key 时前端服务层回落为 `mode=demo`
  - [x] `fallbackReason` 正常回落到 `missing_key`

- [x] P1-3 通知体验收口
  - [x] 顶栏通知与“我的”页共用同一份 store
  - [x] 点击通知后已读状态同步
  - [x] 个人页通知只显示最近 12 条
  - [x] 新增前端测试覆盖顶栏通知已读同步

- [x] P1-4 全球站链路复核
  - [x] `frontai-web` 构建通过
  - [x] `frontai-web` TypeScript `--noEmit` 通过
  - [x] 前端服务层请求 `/api/ai/tools` 时，AI 正常 / fallback 两条链路均可用

## P2：体验与内容打磨

- [ ] P2-1 视觉微调
  - [ ] 移动端按钮热区再做一轮人工复核
  - [ ] 桌面三栏密度再做一轮人工复核
  - [x] 长标题、长帖子、长 AI 回答不撑破布局
  - [x] UI 图标全部使用 Lucide

- [ ] P2-2 内容质量
  - [x] 登录页移除测试账号文案
  - [x] 首页推荐空间改为高频需求优先
  - [x] 空间子文章 seed 内容改成真实校园说明
  - [ ] 继续补更多真实校园空间内容

- [x] P2-3 性能观察
  - [x] `frontlife-web` 构建产物记录：`2,529.24 kB`，gzip `590.73 kB`
  - [x] `frontai-web` 构建产物记录：`2,586.48 kB`，gzip `562.37 kB`
  - [x] 当前仅记录，不提前做性能重构

- [x] P2-4 试用准备
  - [x] 已新增 [v0.3.1 真人试用任务](./usability-tasks-v0.3.1.md)

## 执行记录

- 2026-04-24：`frontlife-web` 测试通过（18/18），新增覆盖 `401` 横幅、登录页失效提示、顶栏通知已读同步。
- 2026-04-24：`server` 测试通过（13/13）。
- 2026-04-24：`frontlife-web` / `server` / `frontai-web` TypeScript `--noEmit` 通过。
- 2026-04-24：`frontlife-web` 构建通过，JS 包体 `2,529.24 kB`，gzip `590.73 kB`。
- 2026-04-24：`frontai-web` 构建通过，JS 包体 `2,586.48 kB`，gzip `562.37 kB`。
- 2026-04-24：`db:push` 成功，schema 无变更。
- 2026-04-24：`db:seed` 成功，按可复现重置流程导入 8 个空间、59 篇文章、2 条帖子。
- 2026-04-24：真实 API smoke 通过，覆盖 health、spaces、articles、login、permissions、posts、replies、feedback、notifications、AI search、AI write、article publish。
- 2026-04-24：无 AI key 条件下，校园站 `/api/ai/search`、`/api/ai/write` 和全球站 `/api/ai/tools` 降级验证通过。
- 2026-04-24：全量 PRD P0 平台闭环回归通过：`shared` typecheck、`server` typecheck、`server` 测试通过（19/19）、`db:push`、`db:seed`、`admin-console` typecheck/lint/build、`frontlife-web` typecheck/lint/test/build、`frontai-web` typecheck/lint/build。
- 2026-04-24：最新包体记录：`admin-console` JS `258.66 kB`，gzip `80.88 kB`；`frontlife-web` JS `2,531.00 kB`，gzip `590.93 kB`；`frontai-web` JS `2,586.12 kB`，gzip `562.30 kB`。
