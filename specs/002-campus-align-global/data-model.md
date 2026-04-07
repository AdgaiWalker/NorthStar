# Data Model: 国内站对齐全球站内容组织

**Feature**: 002-campus-align-global
**Date**: 2026-04-08

## 实体定义

### CampusTopic（专题）— 新增

```typescript
interface CampusTopic {
  id: string;           // 唯一标识，如 "topic-arrival"
  title: string;        // 专题标题，如"新生报到全攻略"
  description: string;  // 专题描述
  coverImage: string;   // 封面图 URL
  category: string;     // 所属分类 slug（如 "arrival"）
  articleIds: string[]; // 包含的文章 ID 列表（有序）
}
```

**校验规则**:
- `id` 必须全局唯一
- `category` 必须是 `CAMPUS_CATEGORIES` 中已定义的 slug
- `articleIds` 中的每个 ID 必须对应一篇已存在的 `CampusArticle`
- `articleIds` 可以为空（但空专题不显示卡片）

### CampusArticle（文章）— 修改

```typescript
interface CampusArticle {
  // 已有字段
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  views: number;
  likes: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;

  // 新增字段
  topicId?: string;  // 所属专题 ID（可选，无则表示独立文章）
}
```

**校验规则**:
- `topicId` 如果存在，必须对应一个已定义的 `CampusTopic`
- 每篇文章最多属于一个专题（一对一关系）

## 关系图

```
CampusCategory (8 个，常量定义)
  └── 1:N ── CampusTopic (0+ 个专题)
              └── 1:N ── CampusArticle (有序文章列表)

CampusArticle (独立文章，无 topicId)
```

## 种子数据

### 专题

| ID | 标题 | 分类 | 包含文章 |
|---|---|---|---|
| topic-arrival | 新生报到全攻略 | arrival | campus-a2, campus-a3, campus-a6 |
| topic-save | 校园省钱指南 | shopping | campus-a5, campus-a1 |

### 文章调整

以下文章需新增 `topicId` 字段：

| 文章 ID | 新增 topicId |
|---|---|
| campus-a2 | topic-arrival |
| campus-a3 | topic-arrival |
| campus-a6 | topic-arrival |
| campus-a5 | topic-save |
| campus-a1 | topic-save |

其余文章（campus-a4, campus-a7, campus-a8）保持独立，不设 topicId。

## Store 新增方法

```typescript
// 获取所有专题
getTopics(): CampusTopic[];

// 按分类获取专题
getTopicsByCategory(categorySlug: string): CampusTopic[];

// 按专题获取文章（有序）
getArticlesByTopic(topicId: string): CampusArticle[];

// 按 ID 获取专题
getTopicById(id: string): CampusTopic | undefined;
```

## 数据生命周期

- **原型阶段**: 硬编码种子数据，Zustand persist 持久化到 localStorage
- **后端接入后**: 替换种子数据为 API 调用，接口契约保持一致
