# Data Model: 校园生活数据模型

## 校园后端 PostgreSQL 数据模型（Prisma Schema）

### Article（文章）

校园前端的核心内容实体。

```prisma
model Article {
  id          String   @id @default(cuid())
  title       String   @db.VarChar(200)
  summary     String   @db.VarChar(500)
  content     String   @db.Text              // Markdown 正文
  coverImage  String?  @db.VarChar(500)       // 封面图 URL

  // 分类与面
  face        String   @default("ai")         // "ai" | "campus-life"
  category    String?                          // 校园分类标识（face=campus-life 时必填）
  domain      String?  @db.VarChar(20)         // 领域（ai 面时使用）

  // 受众分层
  visibility  String   @default("public")      // "public" | "campus"
  schoolId    String?  @db.VarChar(50)          // campus 时必填

  // 状态
  status      String   @default("draft")       // "draft" | "published"

  // 统计
  views       Int      @default(0)
  likes       Int      @default(0)

  // 时间
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?

  @@index([face, category, status])
  @@index([face, status])
  @@index([visibility, schoolId])
}
```

### CampusLifeCategory（校园生活分类）

```prisma
model CampusLifeCategory {
  id          String   @id @default(cuid())
  slug        String   @unique                 // arrival | food | shopping | ...
  name        String   @db.VarChar(20)          // 新生报到 | 吃 | 买 | ...
  icon        String   @db.VarChar(50)          // 图标名称（Lucide icon key）
  sortOrder   Int      @default(0)              // 展示排序
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

### 种子分类数据

| slug | name | icon | sortOrder |
|------|------|------|-----------|
| arrival | 新生报到 | Plane | 1 |
| food | 吃 | UtensilsCrossed | 2 |
| shopping | 买 | ShoppingBag | 3 |
| transport | 出行 | Bus | 4 |
| admin | 办事 | FileText | 5 |
| activity | 活动 | Calendar | 6 |
| secondhand | 二手 | Repeat | 7 |
| pitfalls | 避坑 | ShieldAlert | 8 |

## 前端共享类型扩展

### ContentItem 扩展字段

```typescript
interface ContentItem {
  // ... 现有字段不变
  face: 'ai' | 'campus-life';    // 新增，默认 'ai'
  category?: string;              // 新增，校园分类 slug
}
```

### CampusLifeCategory 前端类型

```typescript
interface CampusLifeCategory {
  slug: string;
  name: string;
  icon: string;
  description?: string;
  articleCount?: number;
}
```

## 状态流转

```
文章生命周期（校园后端）:

draft → published（站长在 AI 后台发布）
published → draft（下架）

校园前端只读取 status='published' 的文章。
```

## 数据隔离规则

| 规则 | 实现 |
|------|------|
| AI 前端看不到校园内容 | 前端过滤 face='ai' |
| 校园前端看不到 AI 内容 | 前端只调校园 API，校园 API 只返回 face='campus-life' |
| campus 内容按 schoolId 隔离 | 校园 API 根据 schoolId 参数过滤 |
| 公开内容所有人可见 | visibility='public' 无需认证 |
