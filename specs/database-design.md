# 盘根校园站 — 数据库设计

> 版本：v1.0
> 日期：2026-04-21
> 状态：待评审

---

## 一、设计原则

1. **单一数据库**：校园站独立数据库，与全球站物理隔离（两站账号体系独立）。
2. **预留多城市**：`cities` 表 + `users.city_id`，黑河学院初期单城市，`city_id` 默认写死。
3. **计数冗余**：`articles.read_count`、`articles.helpful_count` 等直接存表，避免实时聚合。
4. **活动驱动排序**：`activities` 表记录每次"读/收藏/反馈/更新"，首页 Feed 按最近活动时间排序。
5. **自引用嵌套**：`articles.parent_id` 实现子文章无限层级，递归查询在应用层处理。

---

## 二、表结构总览

```
cities              — 城市/站点（多城市预留）
users               — 用户（信任等级 Lv0~Lv4 + 管理员）
knowledge_bases     — 知识库
articles            — 文章（长内容，支持嵌套子文章）
posts               — 帖子（短内容，标签驱动）
post_replies        — 帖子回复
feedbacks           — 反馈（有帮助 / 有变化）
activities          — 活动记录（排序用）
auth_requests       — 认证申请（人工审核）
favorites           — 收藏
notifications       — 通知
```

---

## 三、详细字段

### 3.1 cities（城市/站点）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| code | varchar(50) | UK | 城市标识，如 `heihe` |
| name | varchar(50) | | 城市名，如 `黑河` |
| domain | varchar(100) | | 绑定域名 |
| is_active | boolean | default true | 是否启用 |
| created_at | timestamp | default now() | |

**初始数据**：
```sql
INSERT INTO cities (code, name, domain) VALUES ('heihe', '黑河', 'xyzidea.cn');
```

---

### 3.2 users（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| phone | varchar(20) | UK, nullable | 手机号注册 |
| wx_open_id | varchar(255) | UK, nullable | 微信登录 |
| nickname | varchar(50) | not null | 昵称 |
| avatar | text | | 头像 URL |
| school | varchar(100) | | 学校名称 |
| city_id | int | FK → cities | 所属城市 |
| trust_level | enum | default 'user' | guest/user/active/author/senior/admin |
| post_count | int | default 0 | 发帖数冗余 |
| article_count | int | default 0 | 文章数冗余 |
| created_at | timestamp | | |
| updated_at | timestamp | | |
| last_active_at | timestamp | | 用于活跃度计算和降级提醒 |

**信任等级说明**：

| 等级 | 枚举值 | 权限 | 获得方式 |
|------|--------|------|---------|
| Lv0 | guest | 阅读、搜索 | 无需注册 |
| Lv1 | user | 发帖、收藏、反馈 | 手机号/微信注册 |
| Lv2 | active | 可被认证 | 发帖≥3 且活跃≥7 天 |
| Lv3 | author | 写文章、影响力面板 | 人工审核通过 |
| Lv4 | senior | 认领知识库、协助管理 | Lv3 持续贡献≥90 天 |
| 管理 | admin | 审核、数据、等级调整 | 团队内部 |

**索引**：`phone`, `wx_open_id`, `trust_level`, `city_id`

---

### 3.3 knowledge_bases（知识库）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| slug | varchar(100) | UK | URL 标识，如 `zhangsan` |
| title | varchar(100) | not null | 知识库标题 |
| description | text | | 简介 |
| owner_id | int | FK → users, not null | 创建者 |
| category | varchar(50) | | 分类标签（筛选用）|
| cover | text | | 封面图 |
| is_claimed | boolean | default false | 是否被认领 |
| claimed_by | int | FK → users | 认领者 |
| article_count | int | default 0 | 文章数冗余 |
| favorite_count | int | default 0 | 收藏数冗余 |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**行为**：
- 用户认证通过后，系统自动创建一条 `title = "我的知识库"` 的记录。
- 作者毕业后无人维护，Lv4 可认领（修改 `owner_id` 或 `claimed_by`）。

**索引**：`owner_id`, `category`

---

### 3.4 articles（文章）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| kb_id | int | FK → knowledge_bases, not null | 所属知识库 |
| parent_id | int | FK → articles, nullable | 父文章（嵌套子文章）|
| title | varchar(200) | not null | |
| slug | varchar(200) | not null | URL 标识 |
| content | text | not null | Markdown 正文 |
| toc | jsonb | | 目录结构缓存 `[{level, text, id}]` |
| cover | text | | 封面图 |
| author_id | int | FK → users, not null | |
| status | enum | default 'published' | draft / published / archived |
| confirmed_at | timestamp | | 上次确认时间（"有帮助"刷新）|
| helpful_count | int | default 0 | |
| changed_count | int | default 0 | |
| read_count | int | default 0 | |
| favorite_count | int | default 0 | |
| sort_order | int | default 0 | 同层级排序 |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**嵌套规则**：
- `parent_id` 自引用，无限层级。
- 导航树查询：先按 `kb_id` 过滤，再递归组织层级（应用层处理）。
- 父文章和子文章各自拥有独立 `toc`。

**索引**：`kb_id`, `parent_id`, `author_id`, `status`, `created_at`

---

### 3.5 posts（帖子）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| kb_id | int | FK → knowledge_bases, nullable | 所属知识库（认证作者发帖时归属）|
| title | varchar(200) | nullable | 帖子标题可为空 |
| content | text | not null | 短文本 |
| tags | jsonb | default '[]' | `['求助', '二手', '活动', '讨论', '分享']` |
| author_id | int | FK → users, not null | |
| reply_count | int | default 0 | |
| read_count | int | default 0 | |
| favorite_count | int | default 0 | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**标签说明**：v1 用帖子 + 标签代替独立话题。`#讨论` 标签的帖子即为讨论帖。

**索引**：`author_id`, `kb_id`, `created_at`

---

### 3.6 post_replies（帖子回复）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| post_id | int | FK → posts, not null | |
| content | text | not null | |
| author_id | int | FK → users, not null | |
| created_at | timestamp | | |

**索引**：`post_id`, `author_id`

---

### 3.7 feedbacks（反馈：有帮助 / 有变化）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| target_type | varchar(20) | not null | 'article' / 'post' |
| target_id | int | not null | |
| user_id | int | FK → users, not null | |
| type | enum | not null | helpful / changed |
| changed_note | text | | "什么变了？" |
| created_at | timestamp | | |

**行为**：
- `type = 'helpful'`：刷新目标文章的 `confirmed_at`。
- `type = 'changed'`：写入 `changed_note`，通知作者，目标 `changed_count + 1`。

**索引**：`(target_type, target_id)`, `user_id`

---

### 3.8 activities（活动记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| target_type | varchar(20) | not null | article / post / knowledge_base |
| target_id | int | not null | |
| user_id | int | FK → users, nullable | 系统更新可为空 |
| action | enum | not null | read / helpful / changed / favorite / update / reply |
| created_at | timestamp | | |

**用途**：首页 Feed 按"最近活动"排序。每次用户读、反馈、收藏、作者更新时插入一条记录。

**首页 Feed 查询逻辑**：
```sql
SELECT target_type, target_id, MAX(created_at) AS last_active
FROM activities
GROUP BY target_type, target_id
ORDER BY last_active DESC
LIMIT 20 OFFSET 0;
```

**索引**：`(target_type, target_id)`, `created_at`, `user_id`

---

### 3.9 auth_requests（认证申请）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| user_id | int | FK → users, not null | 申请人 |
| status | enum | default 'pending' | pending / approved / rejected |
| reason | text | | 申请理由 |
| portfolio | text | | 代表作品或描述 |
| reviewed_by | int | FK → users | 审核人 |
| reviewed_at | timestamp | | |
| reject_reason | text | | 拒绝理由 |
| created_at | timestamp | | |

**行为**：
- 用户提交申请 → status = pending。
- 管理员审核 → approved（用户 trust_level 升为 author，自动创建知识库）或 rejected（可重新申请）。
- **必须人工审核，不可自动通过。**

**索引**：`user_id`, `status`

---

### 3.10 favorites（收藏）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| user_id | int | FK → users, not null | |
| target_type | varchar(20) | not null | article / knowledge_base |
| target_id | int | not null | |
| created_at | timestamp | | |

**唯一约束**：`(user_id, target_type, target_id)` — 同一用户不能重复收藏。

---

### 3.11 notifications（通知）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 自增 |
| user_id | int | FK → users, not null | 接收人 |
| type | enum | not null | feedback_changed / low_activity / auth_result / claim_request |
| title | varchar(200) | not null | |
| content | text | | |
| is_read | boolean | default false | |
| related_id | int | | 关联目标 ID |
| related_type | varchar(20) | | 关联目标类型 |
| created_at | timestamp | | |

**行为**：
- `feedback_changed`：有人反馈"有变化"，通知作者。
- `low_activity`：文章 30 天无人阅读，私下提醒作者。
- `auth_result`：认证审核结果。
- 前端轮询拉取未读通知，不上 WebSocket。

**索引**：`user_id`, `is_read`

---

## 四、核心关系图

```
users ||--o{ knowledge_bases : owns
users ||--o{ articles : writes
users ||--o{ posts : writes
users ||--o{ post_replies : writes
users ||--o{ feedbacks : gives
users ||--o{ favorites : saves
users ||--o{ notifications : receives
users ||--o{ auth_requests : applies

knowledge_bases ||--o{ articles : contains
knowledge_bases ||--o{ posts : contains

articles ||--o{ articles : parent_of   // 自引用嵌套

posts ||--o{ post_replies : has

cities ||--o{ users : contains
```

---

## 五、关键设计决策

### 5.1 为什么不用独立的话题表？

PRD 明确：v1 用帖子 + `#讨论` 标签代替话题。`posts.tags` 为 `jsonb` 数组，查询时 `WHERE tags @> '["讨论"]'` 即可。

全量版本保留此设计，不新增独立话题表，降低复杂度。

### 5.2 为什么 activities 单独成表？

首页 Feed 的"活动排序"是核心机制。如果把活动字段分散在各表，无法统一排序。
`activities` 作为事件流，插入即走，查询按 `(target_type, target_id)` 分组取 `MAX(created_at)`。

### 5.3 计数为什么冗余在 articles/posts 表？

`read_count`、`helpful_count` 等直接存表，查询时无需 `JOIN + COUNT`。反馈行为触发时，同步更新对应计数。

风险：并发更新可能丢失。 mitigation：应用层用 `UPDATE articles SET read_count = read_count + 1 WHERE id = ?`，利用数据库原子性。

### 5.4 多城市预留但不实现

`cities` 表 + `users.city_id` 预留字段，黑河学院上线时所有用户 `city_id = 1`。未来多城市时，后端通过 `SITE=cn` 环境变量或域名判断当前城市，查询自动过滤。

---

## 六、待确认问题

1. **Obsidian Vault 导入的文件存储**：导入时图片等附件是否直接写入服务器磁盘，还是走统一上传接口？
2. **AI 对话式写作的会话状态**：AI 写作是多轮对话，会话历史存在前端 Zustand 还是后端数据库？
3. **删除策略**：用户删除帖子/文章是物理删除还是软删除（status = archived）？我倾向软删除。
