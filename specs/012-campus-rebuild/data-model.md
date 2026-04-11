# Data Model: 校园站前端重建

**Branch**: `012-campus-rebuild` | **Date**: 2026-04-10

## Entities

### CampusArticle（校园文章）

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | `string` | ✅ | 唯一标识，格式 `campus-{a\|b}{n}`（如 `campus-a1`, `campus-b32`） |
| title | `string` | ✅ | 文章标题 |
| summary | `string` | ✅ | 文章摘要（≤100 字） |
| content | `string` | ✅ | 文章正文（Markdown 格式） |
| coverImage | `string` | ❌ | 封面图 URL（picsum 占位图） |
| category | `string` | ✅ | 所属分类 slug（arrival/food/shopping/transport/admin/activity/secondhand/pitfalls） |
| visibility | `'public' \| 'campus'` | ✅ | 可见性，校园站文章默认 `campus` |
| schoolId | `string` | ❌ | 学校标识（预留，原型阶段为空） |
| views | `number` | ✅ | 浏览量（种子数据预设值） |
| likes | `number` | ✅ | 点赞数（种子数据预设值） |
| publishedAt | `string` | ✅ | 发布日期（ISO 8601） |
| topicId | `string` | ❌ | 所属专题 ID（可选，独立文章无此字段） |

### CampusTopic（校园专题）

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | `string` | ✅ | 唯一标识，格式 `topic-{category}`（如 `topic-arrival`） |
| title | `string` | ✅ | 专题标题 |
| description | `string` | ✅ | 专题描述（≤50 字） |
| coverImage | `string` | ❌ | 封面图 URL |
| category | `string` | ✅ | 所属分类 slug |
| articleIds | `string[]` | ✅ | 包含的文章 ID 列表 |

### CampusCategoryDef（校园分类定义）

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | `string` | ✅ | 分类唯一标识（如 `arrival`） |
| name | `string` | ✅ | 分类显示名称（如"新生报到"） |
| icon | `LucideIcon` | ✅ | 分类图标（lucide-react 组件） |
| color | `string` | ✅ | 分类颜色（HEX，如 `#3B82F6`） |
| description | `string` | ❌ | 分类描述 |
| sortOrder | `number` | ✅ | 排序权重（越小越前） |
| enabled | `boolean` | ✅ | 是否启用 |

## Relationships

```
CampusCategoryDef (8个)
    ├── 1:N → CampusArticle (category slug)
    └── 1:N → CampusTopic (category slug)

CampusTopic (8个)
    └── N:M → CampusArticle (topicId / articleIds[])

CampusArticle
    └── N:1 → CampusTopic (topicId, optional)
```

## Store Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| initialize | `() => void` | 初始化种子数据（幂等） |
| searchArticles | `(query: string) => CampusArticle[]` | 关键词搜索（标题+摘要+内容） |
| getTopics | `() => CampusTopic[]` | 获取所有专题 |
| getTopicsByCategory | `(slug: string) => CampusTopic[]` | 按分类获取专题 |
| getArticlesByTopic | `(id: string) => CampusArticle[]` | 按专题获取文章 |
| getTopicById | `(id: string) => CampusTopic \| undefined` | 按 ID 获取专题 |

## State Shape

```typescript
interface CampusState {
  articles: CampusArticle[];
  topics: CampusTopic[];
  initialized: boolean;
  // Methods above...
}
```

**Persistence**: Zustand `persist` middleware, key `'campus-store'`，写入 localStorage。

## Seed Data

| Category | Articles | Topics | 备注 |
|----------|----------|--------|------|
| arrival（新生报到） | 10 | 1 | topic-arrival |
| food（吃） | 10 | 1 | topic-food |
| admin（办事） | 11 | 1 | topic-admin |
| pitfalls（避坑） | 9 | 1 | topic-pitfalls |
| activity（活动） | 7 | 1 | topic-activity |
| shopping（买） | 8 | 1 | topic-save（跨分类） |
| secondhand（二手） | 7 | 1 | topic-secondhand |
| transport（出行） | 5 | 1 | topic-transport |
| **总计** | **67** | **8** | |

## Validation Rules

- 文章 ID 必须唯一（当前有 2 个重复 ID 需修复：campus-b4, campus-b13）
- 分类 slug 必须在 CAMPUS_CATEGORIES 中定义
- topicId 引用必须指向已存在的 CampusTopic
- articleIds 中的每个 ID 必须指向已存在的 CampusArticle
