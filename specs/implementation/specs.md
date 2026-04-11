# 实现规格（Implementation Specs）

> 本文档供 AI 代码生成使用。所有规格基于现有代码库结构编写。
> 前端代码路径：`NorthStar/pangen-ai-compass/src/`
> 后端代码路径：`NorthStar/server/src/`

---

## 架构决策

**双前端 + 单后端**：两套前端共享一个后端，通过请求来源（域名）自动切换站点行为。

- 原型阶段：一个后端实例 + 一个数据库（国内），两个前端通过 Vite proxy 连接
- 上线阶段：同一套代码部署两份（`SITE=cn` / `SITE=com`），各自连各自的数据库
- 数据隔离通过部署配置实现，代码层面统一

**技术栈**：Node.js + Hono + Drizzle + Zod + PostgreSQL + pnpm

**后端目录结构**：

```
NorthStar/server/
├── src/
│   ├── index.ts           # Hono 入口
│   ├── config.ts          # 站点配置（SITE=cn|com 切换）
│   ├── db/
│   │   ├── schema.ts      # Drizzle 全部表定义
│   │   └── migrate.ts     # 迁移
│   ├── middleware/
│   │   ├── auth.ts        # JWT 校验
│   │   ├── siteDetect.ts  # 识别请求来源站点
│   │   └── rbac.ts        # 角色权限
│   ├── routes/
│   │   ├── cn-auth.ts     # 手机号+验证码
│   │   ├── com-auth.ts    # 申请制+邀请制+GitHub OAuth
│   │   ├── content.ts     # 文章/专题/工具/资讯 CRUD
│   │   ├── search.ts      # 关键词搜索
│   │   ├── ai.ts          # AI 搜索/方案/分析
│   │   ├── solution.ts    # 方案+反馈
│   │   ├── interact.ts    # 点赞/评论
│   │   ├── favorite.ts    # 收藏
│   │   ├── user.ts        # 用户
│   │   └── admin.ts       # 管理端
│   └── services/          # 业务逻辑
├── drizzle/               # 迁移文件
└── package.json
```

---

## 架构总览：四层模型

```
数据层（Data）
  ├── 内容数据：工具、文章、专题、资讯
  ├── 行为数据：浏览、点赞、评论、收藏、分享
  └── 分析结果：AI 产出的洞察报告
      ↓
智能层（Intelligence）
  ├── AI 搜索：用户问题 + 内容库 → 摘要 + 推荐
  ├── AI 方案：用户目标 + 工具集 → 方案步骤
  └── AI 分析：指定内容集 + 分析维度 → 质量报告 / 需求洞察 / 创作建议
      ↓
应用层（Application）
  ├── 用户端：首页、搜索、内容浏览、文章阅读、方案、收藏
  ├── 管理端：内容管理、用户管理、审核、数据看板、分析报告
  └── 用户后台：个人资料、方案、收藏、额度、设置
      ↓
分发层（Distribution）
  ├── 站内查看、导出文件（md/txt/csv/PDF/Word）、邮件推送、剪贴板分享
```

---

## 一、数据模型

### 1.1 内容数据

**Domain**（领域，前端常量）

```
type Domain = 'creative' | 'dev' | 'work'
```

| 字段 | 值 | 标签 |
|------|------|------|
| creative | 影视创作 | 需要 AI 创作工具的创作者 |
| dev | 编程开发 | 程序员、开发爱好者 |
| work | 通用办公 | 想用 AI 提高效率的职场人 |

**Tool**（工具，com 站）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| name | string | 工具名称 |
| description | string | 简短描述 |
| fullDescription | string | 完整描述 |
| domain | Domain | 所属领域 |
| tags | string[] | 标签 |
| rating | number | 评分 |
| usageCount | string | 使用量（展示用字符串） |
| imageUrl | string | 封面图 |
| url | string | 官方链接 |
| isFeatured | boolean | 是否精选展览 |
| isFavorite | boolean | 当前用户是否收藏 |

**Topic**（专题/系列）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| title | string | 专题标题 |
| description | string | 专题描述 |
| coverUrl | string | 封面图 |
| domain | Domain | 所属领域 |
| articleCount | number | 包含文章数 |
| rating | number | 评分 |

**Article**（文章）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| topicId | string? | 所属专题（可选，独立文章则无） |
| title | string | 标题 |
| summary | string | 摘要 |
| content | string | 正文（Markdown） |
| domain | Domain | 所属领域 |
| author | string | 作者 |
| authorLevel | 'certified' \| 'user'? | 作者等级 |
| date | string | 发布日期 |
| readTime | string | 阅读时长 |
| relatedToolId | string? | 关联工具 |
| imageUrl | string | 封面图 |
| mediaType | 'text' \| 'image' \| 'video' | 主要媒体形式 |
| isFeatured | boolean | 是否精选 |
| stats | { views, likes, comments } | 统计数据 |

**News**（资讯）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| title | string | 标题 |
| summary | string | 摘要 |
| content | string | 正文（Markdown） |
| source | string | 来源 |
| imageUrl | string | 封面图 |
| mediaType | 'text' \| 'image' \| 'video' | 主要媒体形式 |
| domain | Domain? | 所属领域（可选，通用资讯不绑领域） |
| siteScope | 'com' \| 'cn' | 所属站点 |
| publishedAt | string | 发布时间 |
| stats | { views, likes, comments } | 统计数据 |

**内容展示方式**：

| 内容类型 | 展示方式 | 说明 |
|---------|---------|------|
| Tool | 卡片 + 精选展览 | 常规工具用卡片；精选工具用更大更沉浸的展览卡片 |
| Article | 卡片 + 三栏详情页 | 卡片浏览；详情页左侧专题目录 + 中间正文 + 右侧 TOC |
| News | 信息流卡片 | 时间倒序，支持文字/图片/视频 |
| Topic | 封面卡片 | 全高封面图 + 渐变遮罩 + 标题 + 描述 + 文章数 |

### 1.2 校园站数据模型（cn 站，已有前端类型）

**CampusCategoryDef**（校园领域定义）

| slug | 名称 | 对应 PRD 领域 |
|------|------|--------------|
| daily | 日常起居 | 吃穿住行 |
| growth | 成长提升 | 学社交社团 |
| deal | 精明消费 | 买二手省钱 |

**CampusTopic**（校园专题）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| title | string | 专题标题 |
| description | string | 专题描述 |
| coverImage | string | 封面图 |
| category | string | 所属领域 slug |
| articleIds | string[] | 包含的文章 ID |

**CampusArticle**（校园文章）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| title | string | 标题 |
| summary | string | 摘要 |
| content | string | 正文（Markdown） |
| coverImage | string | 封面图 |
| category | string | 所属领域 slug |
| topicId | string? | 所属专题（可选） |
| visibility | 'public' \| 'campus'? | 可见性 |
| schoolId | string? | 学校隔离 |
| views | number | 浏览数 |
| likes | number | 点赞数 |
| publishedAt | string | 发布时间 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 1.3 用户模型

**User**

| 字段 | 类型 | cn 站 | com 站 |
|------|------|-------|--------|
| id | string (UUID) | ✅ | ✅ |
| name | string | ✅ 昵称 | ✅ 昵称 |
| email | string | ✅ 邮箱 | ✅ 邮箱 |
| avatar | string | ✅ | ✅ |
| role | 'user' \| 'admin' \| 'creator' \| 'superadmin' \| 'editor' \| 'reviewer' | ✅ | ✅ |
| passwordHash | string | ✅ bcrypt | ✅ bcrypt |
| phoneHash | string | ✅（仅 cn） | ❌ 禁止 |
| githubId | string | ❌ | ✅（可选，GitHub 快捷登录） |
| isPro | boolean | ✅ | ✅ |
| createdAt | string | ✅ | ✅ |
| lastLoginAt | string | ✅ | ✅ |

**UserSolution**（用户方案）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| title | string | 方案标题 |
| targetGoal | string | 目标描述 |
| toolIds | string[] | 使用的工具 ID 列表 |
| aiAdvice | string | AI 生成的建议 |
| createdAt | string | 创建时间 |

**GuestQuotaState**（游客额度）

| 字段 | 类型 | 说明 |
|------|------|------|
| aiSearchRemaining | number | 剩余 AI 搜索次数 |
| aiSolutionRemaining | number | 剩余方案生成次数 |
| resetAt | number | 重置时间戳 |

### 1.4 行为数据

**UserAction**（用户行为，用于分析）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| userId | string? | 用户 ID（游客为空） |
| targetType | 'tool' \| 'article' \| 'topic' \| 'news' | 目标内容类型 |
| targetId | string | 目标内容 ID |
| action | 'view' \| 'like' \| 'comment' \| 'favorite' \| 'share' | 行为类型 |
| createdAt | string | 行为时间 |

**Comment**（评论）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| userId | string | 评论者 ID |
| targetType | 'article' \| 'tool' \| 'news' | 目标类型 |
| targetId | string | 目标 ID |
| content | string | 评论内容 |
| createdAt | string | 评论时间 |

### 1.5 分析结果

**AnalysisReport**（分析报告）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| title | string | 报告标题 |
| type | 'quality' \| 'demand' \| 'direction' | 分析类型 |
| targetIds | string[] | 分析的内容 ID 集合 |
| dimensions | string[] | 分析维度 |
| result | object | 结构化分析结果（JSON） |
| summary | string | AI 生成的摘要 |
| createdAt | string | 生成时间 |

---

## 二、API 契约

### 2.1 认证 API

**cn 站（手机号 + 验证码）**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 手机号 + 验证码注册 |
| POST | /api/auth/login | 手机号 + 密码登录 |
| POST | /api/auth/sms/send | 发送验证码 |
| POST | /api/auth/logout | 退出登录 |
| POST | /api/auth/refresh | 刷新 token |

**com 站（申请制 + 邀请制 + GitHub OAuth）**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/apply | 提交注册申请（邮箱 + 说明理由） |
| GET | /api/admin/applications | 管理员：查看申请列表 |
| POST | /api/admin/applications/:id/approve | 管理员：批准申请（生成注册链接发送邮件） |
| POST | /api/admin/applications/:id/reject | 管理员：拒绝申请 |
| POST | /api/auth/register-by-invite | 凭邀请码注册 |
| POST | /api/auth/generate-invite | 已有用户生成邀请码（每人限量 N 个） |
| GET | /api/auth/github | GitHub OAuth 入口 |
| GET | /api/auth/github/callback | GitHub OAuth 回调（需绑定邀请码或已审核通过） |
| POST | /api/auth/login | 邮箱 + 密码登录 |
| POST | /api/auth/logout | 退出登录 |
| POST | /api/auth/refresh | 刷新 token |

### 2.2 内容 API（两站一致）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/articles | 文章列表（支持 domain、topicId、page、limit 过滤） |
| GET | /api/articles/:id | 文章详情 |
| GET | /api/topics | 专题列表（支持 domain 过滤） |
| GET | /api/topics/:id | 专题详情 |
| GET | /api/tools | 工具列表（仅 com 站，支持 domain 过滤） |
| GET | /api/tools/:id | 工具详情 |
| GET | /api/news | 资讯列表（支持 domain、siteScope、page、limit 过滤） |
| GET | /api/news/:id | 资讯详情 |

### 2.3 搜索 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/search | 普通搜索（keyword 参数，返回 Article/Topic/Tool/News 列表） |
| POST | /api/ai/search | AI 搜索（消耗次数） |
| POST | /api/ai/solution | AI 方案生成（消耗次数） |

**AI 搜索输入**：

| 字段 | 类型 | 说明 |
|------|------|------|
| query | string | 用户自然语言问题 |
| availableTools | Tool[]? | 工具数组（com 站） |
| availableArticles | Article[] | 文章数组 |
| availableTopics | Topic[] | 专题数组 |
| contentScope | string | 'professional' \| 'comprehensive' |

**AI 搜索输出**：

| 字段 | 类型 | 说明 |
|------|------|------|
| mode | 'ai' \| 'demo' | 模式标识 |
| fallbackReason | string? | 回退原因 |
| summary | string | 摘要 |
| recommendation | string | 路径建议 |
| suggestedTools | string[] | 推荐工具（≤3） |
| suggestedArticles | string[] | 推荐文章（≤2） |

**AI 方案生成输入**：

| 字段 | 类型 | 说明 |
|------|------|------|
| toolIds | string[] | 已选工具 |
| goal | string | 用户目标 |
| query | string | 原始问题 |

**AI 方案生成输出**：

| 字段 | 类型 | 说明 |
|------|------|------|
| mode | 'ai' \| 'demo' | 模式标识 |
| fallbackReason | string? | 回退原因 |
| title | string | 方案标题 |
| aiAdvice | string | AI 建议（含步骤） |

### 2.4 互动 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/interact/like | 点赞（body: { targetType, targetId }） |
| DELETE | /api/interact/like | 取消点赞 |
| GET | /api/interact/comments | 评论列表（query: targetType, targetId） |
| POST | /api/interact/comments | 发表评论（body: { targetType, targetId, content }） |
| DELETE | /api/interact/comments/:id | 删除评论 |

### 2.5 方案 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/solutions | 我的方案列表 |
| POST | /api/solutions | 创建方案 |
| GET | /api/solutions/:id | 方案详情 |
| DELETE | /api/solutions/:id | 删除方案 |
| GET | /api/solutions/:id/export?format=md\|txt\|csv | 导出方案 |

### 2.6 收藏 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/favorites | 收藏列表 |
| POST | /api/favorites | 添加收藏（body: { type: 'tool'\|'article'\|'news', targetId }） |
| DELETE | /api/favorites/:id | 取消收藏 |

### 2.7 用户 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/profile | 获取个人信息 |
| PUT | /api/user/profile | 更新个人信息 |
| GET | /api/user/stats | 使用统计 |
| DELETE | /api/user/account | 注销账号 |

---

## 三、前端类型定义

> 已存在于代码库中，此处为索引。新增类型标记为 🆕。

| 文件 | 核心类型 |
|------|---------|
| `src/types.ts` | Domain, Topic, Tool, Article, User, UserSolution, ThemeMode, Language, ExportFormat, CertificationStatus, StudentCertification, LibraryMode, ViewState, AnalyticsEvent, UserStats, PlatformStats, ContentStatus, ContentVisibility, ContentItem |
| `src/types/review.ts` | ReviewTask, Reviewer, AuditLog, ReviewTaskStatus |
| `src/services/aiContract.ts` | AISearchMode, FallbackReason, AISearchResultV2, AISolutionResult |
| `src/campus/store.ts` | CampusTopic, CampusArticle, CampusState |
| `src/campus/constants.ts` | CampusCategoryDef |
| `src/campus/services/campusAIService.ts` | CampusAISearchResult |
| `src/store/useAppStore.ts` | AppState（主题、语言、登录态、选中工具、方案、收藏、认证） |
| `src/store/useContentStore.ts` | ContentState（内容管理）、TreeNode |
| `src/store/useReviewStore.ts` | ReviewState（审核流程） |
| `src/campus/store.ts` | CampusState（校园站数据） |
| `src/utils/quota.ts` | GuestQuotaState（游客额度） |
| 🆕 `src/types/content.ts` | News, UserAction, Comment, AnalysisReport, MediaType |

---

## 四、种子数据规格

### 4.1 全球站（com）种子数据

当前已有 mock 数据（`src/constants.ts`）：

| 类型 | 数量 | 说明 |
|------|------|------|
| MOCK_TOOLS | 6 | Cursor, Midjourney, Gamma, V0.dev, Runway Gen-3, Notion AI |
| MOCK_TOPICS | 2 | Git 版本管理、短视频创作 |
| MOCK_ARTICLES | 4 | Cursor 重构、Midjourney 角色、Gamma PPT、Git 分支 |

**需要补充**：每个领域至少 5 个工具、3 个专题、10 篇文章、5 条资讯。

### 4.2 校园站（cn）种子数据

当前已有种子数据（`src/campus/store.ts`）：

| 类型 | 数量 | 说明 |
|------|------|------|
| SEED_TOPICS | 8 | 新生报到、省钱、美食、出行等 |
| SEED_ARTICLES | 67 | 覆盖美食、购物、出行、行政、活动、二手、避坑 |

**需要调整**：将现有 8 个分类（arrival/food/shopping/transport/admin/activity/secondhand/pitfalls）归入 PRD 定义的 3 个领域：

| 领域 | 包含的现有分类 |
|------|--------------|
| daily（日常起居） | food, transport |
| growth（成长提升） | activity, admin |
| deal（精明消费） | shopping, secondhand, pitfalls |
| arrival（迎新专区） | 保持为独立标签，可跨领域 |

---

## 五、认证流程

### 5.1 cn 站认证（手机号）

```
用户输入手机号
    → 前端调用 POST /api/auth/sms/send
    → 后端调用短信服务（阿里云/腾讯云 SMS）发送验证码
    → 用户输入验证码
    → 前端调用 POST /api/auth/register（新用户）或 POST /api/auth/login（已有密码）
    → 后端验证码校验 → 返回 JWT token
    → 前端存储 token（localStorage + Zustand）
```

**原型阶段**：mock 验证码（固定 123456），不走真实短信。

### 5.2 com 站认证（申请制 + 邀请制 + GitHub OAuth）

**申请制流程**：

```
用户填写申请表（邮箱 + 一句话说明理由）
    → POST /api/auth/apply
    → 后端存入 applications 表，状态 pending
    → 管理员在后台审核
    → 批准后：系统生成注册令牌，发送邮件
    → 用户点击邮件链接 → 填密码 → 完成注册
```

**邀请制流程**：

```
已有用户点击"邀请朋友" → POST /api/auth/generate-invite
    → 后端生成邀请码（每人限额 N 个）
    → 用户分享邀请码给朋友
    → 朋友输入邀请码 + 邮箱 + 密码 → POST /api/auth/register-by-invite
    → 后端验证邀请码有效 → 直接创建账号
```

**GitHub OAuth 流程**（保留为快捷通道）：

```
用户点击"GitHub 登录" → GET /api/auth/github
    → 重定向到 GitHub OAuth 授权页
    → GitHub 回调 GET /api/auth/github/callback?code=xxx
    → 后端用 code 换取 GitHub 用户信息
    → 检查该用户是否已通过申请/邀请审核
    → 是：直接登录 → 否：提示需先完成申请
```

**原型阶段**：申请制用 mock（管理员按钮一键通过），邀请码用固定测试码，GitHub OAuth 可暂不实现。

---

## 六、部署配置

### 6.1 原型阶段（当前）

| 项目 | 配置 |
|------|------|
| 后端 | 一个 Node.js + Hono 实例，国内服务器 |
| 数据库 | 一个 PostgreSQL 实例，国内节点 |
| 前端 | Vite dev server，通过 proxy 连后端 |
| 站点区分 | 环境变量 `SITE` 或请求域名自动识别 |

### 6.2 上线阶段（同一套代码部署两份）

| 项目 | CN 站 | COM 站 |
|------|-------|--------|
| 前端 | 国内 CDN / 云服务器 | Cloudflare / Vercel |
| 后端 | 国内云服务器（`SITE=cn`） | 香港/新加坡节点（`SITE=com`） |
| 数据库 | PostgreSQL，国内节点 | PostgreSQL，海外节点 |
| 域名 | xyzidea.cn（ICP 备案已完成） | xyzidea.com |
| SSL | Let's Encrypt | Cloudflare 自动证书 |

### 6.3 AI 网关

| 站点 | AI 调用路径 |
|------|-----------|
| cn 站 | 前端 → cn-backend → 智谱 AI（国内） |
| com 站 | 前端 → com-backend → 智谱 AI（海外节点转发） |

**原型阶段**：前端直连智谱 API（通过 Vite proxy），后端搭建后切换为网关代理。

---

## 七、用户后台

### 7.1 页面结构

| 导航项 | 说明 |
|--------|------|
| 个人资料 | 基础信息管理（昵称、头像、邮箱） |
| 我的方案 | 方案列表、查看详情、导出、删除 |
| 收藏夹 | 收藏的工具/文章管理 |
| 我的额度 | AI 搜索/方案生成次数余额与使用记录 |
| 设置 | 主题、语言、导出偏好 |
| 学生认证 | 提交申请、查看状态（cn 站） |

---

## 八、系统后台（管理端）

### 8.1 角色权限

| 角色 | 权限范围 |
|------|---------|
| 超级管理员（superadmin） | 全部功能 |
| 管理员（admin） | 除系统配置外的全部功能 |
| 编辑（editor） | 内容管理、用户管理（只读） |
| 审核员（reviewer） | 内容审核（通过/拒绝） |

**权限矩阵**：

| 功能模块 | superadmin | admin | editor | reviewer |
|---------|-----------|-------|--------|----------|
| 内容管理 | ✓ | ✓ | ✓ | — |
| 内容审核 | ✓ | ✓ | ✓ | ✓ |
| 用户管理 | ✓ | ✓ | 只读 | — |
| 工具管理 | ✓ | ✓ | ✓ | — |
| 数据统计 | ✓ | ✓ | 只读 | — |
| 数据看板 | ✓ | ✓ | — | — |
| 内容分析 | ✓ | ✓ | 只读 | — |
| AI 配置 | ✓ | ✓ | — | — |
| 系统配置 | ✓ | — | — | — |
| 角色管理 | ✓ | — | — | — |

### 8.2 管理端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/articles | 文章列表（支持筛选、分页） |
| POST | /api/admin/articles | 创建文章 |
| PUT | /api/admin/articles/:id | 编辑文章 |
| DELETE | /api/admin/articles/:id | 删除文章 |
| PUT | /api/admin/articles/:id/status | 上架/下架 |
| GET | /api/admin/topics | 专题列表 |
| POST | /api/admin/topics | 创建专题 |
| PUT | /api/admin/topics/:id | 编辑专题 |
| DELETE | /api/admin/topics/:id | 删除专题 |
| GET | /api/admin/tools | 工具列表（com 站） |
| POST | /api/admin/tools | 创建工具 |
| PUT | /api/admin/tools/:id | 编辑工具 |
| DELETE | /api/admin/tools/:id | 删除工具 |
| GET | /api/admin/news | 资讯列表 |
| POST | /api/admin/news | 创建资讯 |
| PUT | /api/admin/news/:id | 编辑资讯 |
| DELETE | /api/admin/news/:id | 删除资讯 |
| GET | /api/admin/users | 用户列表（支持搜索、筛选） |
| PUT | /api/admin/users/:id/role | 修改用户角色 |
| PUT | /api/admin/users/:id/status | 启用/禁用账号 |
| GET | /api/admin/applications | 注册申请列表（com 站） |
| POST | /api/admin/applications/:id/approve | 批准申请 |
| POST | /api/admin/applications/:id/reject | 拒绝申请 |
| GET | /api/admin/certifications | 学生认证申请列表（cn 站） |
| POST | /api/admin/certifications/:id/approve | 批准认证 |
| POST | /api/admin/certifications/:id/reject | 拒绝认证 |
| GET | /api/admin/stats | 数据看板（用户量、浏览量、方案量、AI 调用量） |
| GET | /api/admin/audit-logs | 操作日志 |
| PUT | /api/admin/settings | 系统配置 |
| GET | /api/admin/reports | 分析报告列表 |
| POST | /api/admin/reports | 创建分析报告（触发 AI 分析） |
| GET | /api/admin/reports/:id | 报告详情 |
| GET | /api/admin/reports/:id/export?format=pdf\|word | 导出报告 |
| GET | /api/admin/comments | 评论列表（支持按内容、状态筛选） |
| DELETE | /api/admin/comments/:id | 删除评论（违规处理） |

### 8.3 导航结构

左侧导航 + 右侧主内容区。导航项：内容管理、用户管理、认证审核、工具管理、数据看板、内容分析、AI 引擎、系统设置。

---

## 九、智能层（Intelligence）

智能层统一所有 AI 能力，三种模式共享同一个网关和计费体系：

| 模式 | 输入 | 输出 |
|------|------|------|
| AI 搜索 | 用户问题 + 内容库 | 摘要 + 推荐 |
| AI 方案 | 用户目标 + 工具集 | 方案步骤 |
| AI 分析 | 指定内容集 + 分析维度 | 质量报告 / 需求洞察 / 创作建议 |

### 9.1 AI 网关

- 前端**不持有**任何第三方模型厂商的 API Key
- 所有 AI 请求必须通过后端网关发起
- 网关返回结果遵守前端既有 AI 契约
- 支持多模型切换（主：智谱 GLM-4-Flash；备：其他模型）

**网关 API**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ai/search | AI 搜索（代理转发至模型厂商） |
| POST | /api/ai/solution | AI 方案生成 |
| POST | /api/ai/analyze | AI 内容分析（body: { type, targetIds?, dimensions?, timeRange?, domain? }） |
| GET | /api/ai/usage | 当前用户 AI 调用量 |
| GET | /api/admin/ai/config | AI 模型配置（管理端） |
| PUT | /api/admin/ai/config | 更新模型配置（管理端） |
| POST | /api/admin/ai/test | 模型连通性测试（管理端） |

### 9.2 AI 分析模式

**内容质量分析**（quality）

| 输入 | 说明 |
|------|------|
| targetIds | 指定分析的内容 ID 集合 |
| dimensions | 分析维度（如：互动率、评论情感、参与趋势） |

| 输出 | 说明 |
|------|------|
| summary | AI 生成的质量摘要 |
| scores | 各维度评分 |
| highlights | 表现好的内容 |
| warnings | 需要关注的内容（差评多、互动低） |

**用户需求分析**（demand）

| 输入 | 说明 |
|------|------|
| timeRange | 时间范围 |
| domain | 领域过滤（可选） |

| 输出 | 说明 |
|------|------|
| summary | 用户需求趋势摘要 |
| hotTopics | 热门主题（浏览/搜索量高） |
| gapTopics | 有需求但缺内容的主题 |
| sentiment | 用户情绪倾向 |

**创作方向建议**（direction）

| 输入 | 说明 |
|------|------|
| demandAnalysis | 需求分析结果（或自动获取） |
| existingContent | 现有内容盘点 |

| 输出 | 说明 |
|------|------|
| summary | 创作方向摘要 |
| suggestions | 建议创作的主题和形式 |
| priority | 优先级排序（高需求 + 低供给 = 高优先级） |

### 9.3 反馈闭环

```
发布内容 → 用户互动（浏览/点赞/评论/收藏）→ 行为数据采集
    ↓
AI 分析 → 两个出口：
  ① 内容管控：质量差的内容降权/下架，约束发布者
  ② 创作方向：需求高但内容少的领域 → 优先投入创作精力
    ↓
按需求创作新内容 → 发布 → 循环
```

### 9.4 内容同步

- 原型阶段：单数据库，不需要同步
- 上线阶段：cn → com 单向只读同步，定时脚本或 CDC
- 同步内容：articles、topics、tools、news（不含用户数据）

### 9.5 搜索服务

统一搜索入口，两站共用查询逻辑：

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 关键词 |
| type | 'tool' \| 'article' \| 'topic' \| 'news' | 内容类型过滤 |
| domain | string | 领域过滤 |
| page | number | 页码 |
| limit | number | 每页数量 |

### 9.6 通知服务

| 通知类型 | 渠道 | 说明 |
|---------|------|------|
| 注册申请结果 | 邮件（com 站） | 批准/拒绝通知 |
| 邀请注册链接 | 邮件 | 包含一次性注册令牌 |
| 学生认证结果 | 站内消息（cn 站） | 批准/拒绝通知 |
| 方案分享 | 剪贴板复制 | 分享文本含产品名、工具列表、目标、引导语 |

**原型阶段**：邮件通知用 mock（控制台打印），站内消息暂不实现。

---

## 十、核心闭环补全

### 10.1 内容验证标记

内容需要"经过实践验证"的标记，对应产品定位中"实践验证"的承诺。

**VerifiedContent**（验证标记）

| 字段 | 类型 | 说明 |
|------|------|------|
| contentId | string | 关联内容 ID |
| contentType | 'article' \| 'tool' | 内容类型 |
| verifiedBy | string | 验证人（管理员/创作者） |
| verifiedAt | string | 验证时间 |
| method | 'practical' \| 'tested' \| 'community' | 验证方式：亲自实践 / 功能测试 / 社区验证 |
| expiresAt | string? | 过期时间（AI 工具类默认 90 天） |

**验证标记 API**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/verify | 标记内容已验证（body: { contentId, contentType, method }） |
| DELETE | /api/admin/verify/:contentId | 取消验证 |
| GET | /api/verified | 获取已验证内容列表 |

**原型阶段**：验证标记在管理端手动添加，前端用徽章展示。

### 10.2 内容时效性

| 规则 | 说明 |
|------|------|
| AI 工具类内容 | 90 天自动标记为"需复查" |
| 教程类内容 | 180 天自动标记 |
| 管理端 | 显示待复查内容列表，管理员确认或更新后刷新计时 |
| 前端 | 过期内容显示"此内容发布于 X 天前，信息可能已变更"提示 |

### 10.3 方案效果反馈

在方案生成后增加一个反馈入口，直接关联北极星指标。

**SolutionFeedback**（方案反馈）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| solutionId | string | 方案 ID |
| userId | string | 用户 ID |
| helpful | boolean | 是否解决了问题 |
| comment | string? | 补充反馈 |
| createdAt | string | 反馈时间 |

**反馈 API**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/solutions/:id/feedback | 提交方案反馈 |
| GET | /api/admin/solutions/feedback-stats | 方案反馈统计（管理端） |

**前端流程**：

```
用户保存方案 → 使用方案 → 首页/方案列表显示"方案有用吗？"
    → "有用"：标记为有效案例，提升内容推荐权重
    → "没用"：触发 AI 补充建议，同时标记关联内容需改进
```

### 10.4 新用户引导

首页 Hero 区的价值主张需要让新用户在 30 秒内理解差异点。

**引导策略**：

| 元素 | 内容 | 差异化点 |
|------|------|---------|
| Hero 标题 | com：遇到难题？用 AI 解决 / cn：校园生活指南，遇到问题用 AI 解决 | 不是学 AI，是用 AI 解决问题 |
| Hero 副标题 | 你只管提出问题，我们提供实测过的工具和步骤 | "实测过"是和 ChatGPT 的区别 |
| 引导搜索 | 预置 3 个示例问题（可点击直接搜索） | 降低首次使用门槛 |
| 验证徽章 | 已验证内容显示"实测有效"标签 | 建立信任 |
