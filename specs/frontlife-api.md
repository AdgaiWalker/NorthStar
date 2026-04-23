# 盘根校园站 API 对接文档

> 状态：联调基线文档
> 适用范围：`frontlife-web`、`server`、`shared`
> 目标：先统一接口契约，再按优先级把前后端从 demo/内存层切到 PostgreSQL

---

## 1. 文档用途

这份文档解决 4 件事：

1. 明确校园站对外 API 契约
2. 区分“当前实现”和“目标实现”
3. 列清楚数据库缺口，避免只改前端或只改后端
4. 给出前后端联调优先级，防止返工

注意：

- 当前项目已经能本地运行，但很多接口仍主要依赖 `server/src/data/store.ts` 内存数据层
- PostgreSQL 已连通，数据库为 `pathzen`
- 后续联调目标不是“页面能显示”，而是“请求真实落数据库、重启服务后数据仍存在”

---

## 2. 全局约定

### 2.1 基础约定

- Base URL：`/api`
- 返回格式：默认 `application/json`
- 时间字段：统一使用 ISO 8601 string
- 错误响应：统一为

```json
{ "error": "message" }
```

- 分页：统一使用 query

```text
?page=1&pageSize=10
```

- SSE：仅用于 `POST /api/ai/search`

### 2.2 鉴权约定

当前状态：

- 大多数接口未真正做 JWT 校验
- `login/register` 可用，但主要是简化内存认证

目标状态：

- 匿名可访问：`health`、`spaces`、`articles`、`feed`、`ai/search`
- 登录后可访问：`posts create/reply/solve`、`feedbacks`、`favorites`、`profile`
- 权限控制接口：`GET /api/me/permissions`
- 头部：

```http
Authorization: Bearer <token>
```

### 2.3 对外命名

数据库内部仍使用 `knowledge_bases`，但 API 和前端对外统一叫 `space`。

---

## 3. 共享契约

当前共享契约主文件：

- [api-types.ts](E:/桌面/NS/NorthStar/packages/shared/src/api-types.ts)

当前已存在的核心类型：

- `SpaceSummary`
- `ArticleSummary`
- `ArticleDetail`
- `PostRecord`
- `PostReplyRecord`
- `CreatePostInput`
- `CreateArticleInput`
- `AuthResponse`
- `PermissionResponse`
- `FeedResponse`
- `NotificationRecord`
- `FavoriteRecord`
- `ProfileResponse`

这些类型已经足够作为校园站第一版联调契约，但仍需随着数据库化推进补齐字段。

---

## 4. API 目录

## 4.1 P0：必须最先打通

| 方法 | 路径 | 用途 | 鉴权 | 前端页面 | 当前状态 | 目标状态 | 数据表 |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/health` | 健康检查 | 否 | 无 | 已完成 | 保持 | 无 |
| `POST` | `/api/auth/register` | 注册 | 否 | `/login` | 简化内存注册 | 写 `users` 表，密码哈希 | `users` |
| `POST` | `/api/auth/login` | 登录 | 否 | `/login` | 简化内存登录 | 读 `users` 表，签发 JWT | `users` |
| `GET` | `/api/me/permissions` | 当前用户权限 | 是 | `App` 初始化、首页、空间页 | demo 权限 | 根据真实用户等级返回 | `users` |
| `GET` | `/api/spaces` | 空间列表 | 否 | `/explore`、首页推荐 | 走内存层 | PostgreSQL 查询 | `knowledge_bases`, `users` |
| `GET` | `/api/spaces/:id` | 空间详情 + 文章列表 | 否 | `/space/:id` | 走内存层 | PostgreSQL 查询 | `knowledge_bases`, `articles`, `users` |
| `GET` | `/api/articles/:id` | 文章详情 | 否 | `/article/:id` | 走内存层 | PostgreSQL 查询 | `articles`, `knowledge_bases`, `users` |
| `GET` | `/api/spaces/:id/posts` | 空间帖子列表 | 否 | `/space/:id` | 走内存层 | PostgreSQL 查询 | `posts`, `post_replies`, `users` |
| `POST` | `/api/posts` | 发帖 | 是 | 首页、空间页 | 走内存层 | PostgreSQL 写入 | `posts`, `activities` |
| `POST` | `/api/posts/:id/replies` | 回复帖子 | 是 | 空间页帖子浮层 | 走内存层 | PostgreSQL 写入 | `post_replies`, `posts`, `notifications` |
| `POST` | `/api/posts/:id/solve` | 标记求助帖已解决 | 是 | 空间页帖子浮层 | 走内存层 | PostgreSQL 写入 | `posts`, `activities` |
| `POST` | `/api/articles/:id/helpful` | 标记文章有帮助 | 是 | `/article/:id` | 走内存层 | PostgreSQL 写入 | `feedbacks`, `activities`, `articles` |
| `POST` | `/api/articles/:id/changed` | 文章有变化反馈 | 是 | `/article/:id` | 走内存层 | PostgreSQL 写入 | `feedbacks`, `activities`, `articles`, `notifications` |

### 4.1.1 成功响应示例

#### `GET /api/spaces`

```json
{
  "spaces": [
    {
      "id": "food",
      "slug": "food",
      "title": "校园美食地图",
      "description": "吃遍每一食堂",
      "iconName": "Utensils",
      "category": "food",
      "articleCount": 3,
      "helpfulCount": 34,
      "favoriteCount": 12,
      "recentActiveAt": "2026-04-22T00:00:00.000Z",
      "maintainer": {
        "id": "user-1",
        "name": "盘根编辑"
      }
    }
  ]
}
```

#### `GET /api/articles/:id`

```json
{
  "article": {
    "id": "campus-a1",
    "slug": "campus-a1",
    "spaceId": "food",
    "parentId": null,
    "title": "二食堂麻辣烫实测",
    "summary": "人均 15 元，推荐指数 4 星。",
    "content": "# 标题",
    "helpfulCount": 34,
    "changedCount": 1,
    "readCount": 128,
    "favoriteCount": 12,
    "confirmedAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z",
    "author": {
      "id": "user-1",
      "name": "盘根编辑"
    },
    "space": {
      "id": "food",
      "title": "校园美食地图",
      "iconName": "Utensils"
    },
    "changeNotes": []
  },
  "previousArticleId": null,
  "nextArticleId": "campus-b5"
}
```

---

## 4.2 P1：完成“读链路”必须打通

| 方法 | 路径 | 用途 | 鉴权 | 前端页面 | 当前状态 | 目标状态 | 数据表 |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/feed` | 首页混合 Feed | 否 | `/` | 走内存层 | PostgreSQL 聚合查询 | `articles`, `posts`, `feedbacks`, `activities` |
| `POST` | `/api/search/logs` | 搜索日志写入 | 否 | `/search` | 接口存在但不落库 | PostgreSQL 写入 | `search_logs` |
| `POST` | `/api/ai/search` | AI 搜索兜底，SSE | 否 | `/search` | demo SSE | 智谱后端代理 | 无固定表，日志进 `search_logs` |
| `POST` | `/api/reports` | 举报内容 | 是 | 文章页、帖子卡片 | 内存收集 | PostgreSQL 写入 | `reports` 或新增表 |

### 4.2.1 SSE 约定：`POST /api/ai/search`

请求：

```json
{
  "query": "打印店在哪"
}
```

响应头：

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

事件格式：

```text
data: {"delta":"第一段"}

data: {"delta":"第二段"}

data: [DONE]
```

前端规则：

- 收到 `delta` 就追加文字
- 收到 `[DONE]` 结束流
- 失败时回退到错误提示，不要卡死 loading

---

## 4.3 P2：完成“写链路”必须打通

| 方法 | 路径 | 用途 | 鉴权 | 前端页面 | 当前状态 | 目标状态 | 数据表 |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/articles` | 发布文章 | 是，且 `canWrite=true` | `/space/:id` 写作面板 | 走内存层 | PostgreSQL 写入 | `articles`, `activities` |
| `POST` | `/api/ai/write` | AI 生成文章草稿 | 是，且 `canWrite=true` | `/space/:id` 写作面板 | demo 草稿 | 智谱后端代理 | 无固定表 |

---

## 4.4 P3：关系与个人中心

| 方法 | 路径 | 用途 | 鉴权 | 前端页面 | 当前状态 | 目标状态 | 数据表 |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/notifications` | 通知列表 | 是 | Header、`/me` | 走内存层 | PostgreSQL 查询 | `notifications` |
| `POST` | `/api/notifications/:id/read` | 标记已读 | 是 | Header、`/me` | 走内存层 | PostgreSQL 写入 | `notifications` |
| `POST` | `/api/favorites` | 收藏空间/文章 | 是 | 文章页、空间页 | 半完成 | PostgreSQL 写入 | `favorites`, `articles`, `knowledge_bases` |
| `GET` | `/api/me/profile` | 个人页聚合数据 | 是 | `/me` | 走内存层 | PostgreSQL 聚合查询 | `users`, `articles`, `posts`, `favorites`, `notifications` |

---

## 4.5 P4：全球站 AI 网关

| 方法 | 路径 | 用途 | 鉴权 | 前端页面 | 当前状态 | 目标状态 | 数据表 |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/ai/tools` | 全球站 AI 工具推荐与方案生成 | 否 | `frontai-web` | function-calling 兼容 demo | 智谱后端代理 + function calling | 无固定表 |

说明：

- 当前 `frontai-web` 已改用共享 `API_ENDPOINTS.AI_CHAT`
- 但本地 `frontai-web` 的 Vite 配置还没有 `/api -> 4000` 代理，需要补齐

---

## 5. 当前数据库缺口

下面这些不是“可选优化”，而是会直接阻断真实前后端联调的缺口。

| 缺口 | 当前情况 | 影响 | 必须动作 |
|---|---|---|---|
| `search_logs` 表缺失 | schema 中没有 | `2.13` 无法真实完成 | 在 `schema.ts` 增加表并迁移 |
| `reports` 表缺失 | 只有接口，没有表 | 举报无法后台查看 | 新增 `reports` 表 |
| `users` 表没有密码字段 | 只有基础用户资料 | 登录注册无法真实持久化 | 增加 `password_hash` 字段 |
| `posts` 表没有 `solved` 字段 | 当前前端支持“解决了” | 求助帖状态无法持久化 | 增加 `solved` 布尔字段 |
| `post_replies` 表没有 `star_count` 字段 | 前端和契约有星标数 | 回复星标无法持久化 | 增加 `star_count` |
| `notifications` 枚举不完整 | 当前 enum 只有 4 类 | 计划里 6 种通知无法完全覆盖 | 扩展枚举或改成 varchar |
| `favorites.target_type` 注释仍是旧命名 | 当前 API 用 `article/space` | 前后端语义可能不一致 | 统一为 `article/space` 或 `article/knowledge_base` 明确映射 |
| API 仍依赖内存数据层 | `store.ts` 主导多数路由 | 重启服务后业务状态丢失 | 全部切 Drizzle 查询/写入 |

---

## 6. 路由级数据库迁移表

按“谁先切数据库”排序。

| 优先级 | 路由 | 当前数据源 | 目标数据源 |
|---|---|---|---|
| P0 | `spaces.ts` | 内存 `store.ts` | `knowledge_bases + articles + users` |
| P0 | `articles.ts` | 内存 `store.ts` | `articles + knowledge_bases + users` |
| P0 | `posts.ts` | 内存 `store.ts` | `posts + post_replies + users` |
| P0 | `feedbacks.ts` | 内存 `store.ts` | `feedbacks + activities + articles` |
| P0 | `auth.ts` | 内存 `Map` | `users` |
| P1 | `me.ts` | demo 头部角色 | `users.trust_level` 或行为聚合 |
| P1 | `feed.ts` | 内存 `store.ts` | `articles/posts/feedbacks/activities` 聚合 |
| P1 | `search.ts` | 内存 `store.ts` | `search_logs` |
| P2 | `notifications.ts` | 内存 `store.ts` | `notifications` |
| P2 | `favorites.ts` | 内存 `store.ts` | `favorites + users + content` |
| P2 | `reports.ts` | 内存 `store.ts` | `reports` |

---

## 7. 前后端对接优先级

## 7.1 第一阶段：先打通最小真实闭环

目标链路：

`登录 -> 空间列表 -> 空间详情 -> 文章详情 -> 有帮助/有变化 -> 发帖`

必须完成：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me/permissions`
- `GET /api/spaces`
- `GET /api/spaces/:id`
- `GET /api/articles/:id`
- `GET /api/spaces/:id/posts`
- `POST /api/posts`
- `POST /api/articles/:id/helpful`
- `POST /api/articles/:id/changed`

## 7.2 第二阶段：读链路完整化

目标链路：

`首页 Feed -> 搜索结果 -> AI 兜底 -> 文章页 -> 反馈`

必须完成：

- `GET /api/feed`
- `POST /api/search/logs`
- `POST /api/ai/search`

## 7.3 第三阶段：写链路完整化

目标链路：

`空间页发帖 -> 回复 -> 求助帖解决 -> AI 草稿 -> 发布文章`

必须完成：

- `POST /api/posts/:id/replies`
- `POST /api/posts/:id/solve`
- `POST /api/ai/write`
- `POST /api/articles`

## 7.4 第四阶段：关系链路

目标链路：

`通知 -> 收藏 -> 个人页 -> 信任等级`

必须完成：

- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/favorites`
- `GET /api/me/profile`

## 7.5 第五阶段：全球站接入

目标链路：

`frontai-web -> /api/ai/tools -> function calling 兼容响应`

必须完成：

- `POST /api/ai/tools`
- `frontai-web` 本地 `/api` 代理到 `localhost:4000`

---

## 8. 前端对接顺序

## 8.1 `frontlife-web`

先替换：

- [services/api.ts](E:/桌面/NS/NorthStar/packages/frontlife-web/src/services/api.ts)

替换顺序：

1. spaces/articles/posts/auth/feedbacks
2. feed/search
3. notifications/favorites/profile
4. ai/write

原则：

- 先 server 稳定响应 shape，再删 mock 主路径
- `VITE_USE_MOCK=true` 可以保留，但只能作为 fallback，不再作为主路径

## 8.2 `frontai-web`

先做：

- 本地 Vite `/api` proxy -> `http://localhost:4000`
- 再验证 `AIService.ts` 走 `/api/ai/tools`

---

## 9. 验收标准

## 9.1 接口级验收

- 所有 P0 接口都能真实读写 PostgreSQL
- 重启 server 后，发帖/反馈/收藏/通知数据仍存在
- `tsc`、`test`、`build` 通过

## 9.2 页面级验收

- 首页、搜索页、探索页、空间页、文章页、我的页都不再依赖主 mock 路径
- 登录后刷新页面，登录态仍有效
- 文章有帮助、变化反馈、发帖、回复都能跨刷新保留

## 9.3 数据级验收

- `pathzen` 数据库中能看到真实增量：
  - 新用户
  - 新帖子
  - 新回复
  - 新 feedback
  - 新 favorite
  - 新 notification
  - 新 search log

---

## 10. 当前状态

后端主链路已经进入真实数据联调阶段：

1. `spaces/articles/posts/feedbacks/auth/me/feed/search/reports/favorites/notifications/profile` 已切到 PostgreSQL。
2. 受保护接口使用 JWT，未登录返回 `401`。
3. `trust_events` 已用于信任等级事件记录。
4. `POST /api/articles` 已真实写入 `articles`。
5. `POST /api/ai/search`、`POST /api/ai/write`、`POST /api/ai/tools` 已走后端 AI 网关，并保留同结构 fallback。
6. `frontlife-web` 主 API client 已移除主 mock 分支，默认走真实 `/api`。
7. `frontai-web` 已配置本地 `/api -> http://localhost:4000` 代理。

仍可继续打磨：

1. 桌面三栏高亮和目录滚动同步。
2. 更完整的端到端测试。
3. 过期提醒、空间认领、认证邀请的调度器。

---

## 11. 数据库初始化

本地数据库使用：

```env
DATABASE_URL=postgres://postgres:123456@localhost:5432/pathzen
SITE=cn
JWT_SECRET=local-dev-secret-change-later
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

初始化命令：

```bash
cd E:\桌面\NS\NorthStar\packages\server
pnpm db:push
pnpm db:seed
```

seed 后应包含：

- 普通用户 `zhang`
- 编辑用户 `editor`
- 8 个空间
- 文章数据
- 2 条帖子
- 至少 1 组父子文章：`campus-a1-price-child -> parent_id=1`
- `trust_events`、`search_logs`、`reports` 等业务表

验证命令：

```bash
npx tsc --noEmit
pnpm test
```
