# 全量 PRD P0 基线记录

记录时间：2026-04-24

## Git 基线

- 当前分支：`main`
- 实施起点 commit：`6367032c9dd6f10e74eff5c1d80112335fef3ee2`
- 实施起点 tag：`docs/full-prd-plan-v1.0`
- 远端：`origin https://github.com/AdgaiWalker/NorthStar.git`

## 旧路由清单

以下旧路由保留为待替换对象，不新增桥接层：

- `/api/spaces`
- `/api/articles`
- `/api/posts`
- `/api/feed`
- `/api/search`
- `/api/me`
- `/api/favorites`
- `/api/notifications`
- `/api/reports`
- `/api/ai/*`
- `/api/auth/*`

## Mock 调用路径

- 校园站 mock 开关：`NorthStar/packages/frontlife-web/src/services/api.ts` 的 `VITE_USE_MOCK`
- 校园站 mock 数据层：`NorthStar/packages/frontlife-web/src/services/mockApi.ts`
- 全球站本地内容数据：`NorthStar/packages/frontai-web/src/constants.ts`
- 全球站本地内容 store：`NorthStar/packages/frontai-web/src/store/useContentStore.ts`
- 全球站前端模拟登录状态：`NorthStar/packages/frontai-web/src/store/useAppStore.ts`
- 全球站后台审核演示数据：`NorthStar/packages/frontai-web/src/pages/admin/ReviewQueuePage.tsx`
- 全球站 AI fallback/demo：`NorthStar/packages/frontai-web/src/services/AIService.ts`、`NorthStar/packages/frontai-web/src/services/aiFallback.ts`

## 本轮 P0 已验证

- `db:push`：通过
- `db:seed`：通过，输出 `spaces=8`、`articles=59`、`posts=2`
- server test：`1` 个测试文件，`16/16` 通过
- shared typecheck：通过
- server typecheck：通过
- frontlife-web typecheck：通过
- frontlife-web lint：通过
- frontlife-web test：`2` 个测试文件，`18/18` 通过
- frontlife-web build：通过，JS 约 `2531.00 kB`
- frontai-web typecheck：通过
- frontai-web lint：通过
- frontai-web build：通过，JS 约 `2586.12 kB`
- admin-console typecheck：通过
- admin-console lint：通过
- admin-console build：通过，JS 约 `249.36 kB`

## 本轮 P0 新增地基

- 新增 `packages/admin-console`
- 新增 `@ns/shared` 平台契约类型
- 新增 server `modules/*` 标准目录
- 新增 `SiteContext`
- 新增 `site-aware` 基础校验
- 新增 `site_configs`、`audit_logs`、`moderation_tasks`
- 注册登录改为用户名 + 邮箱 + 密码，禁止新增手机号流程
