# API Contract: 校园后端（xyzidea.cn）

**Base URL**: `https://xyzidea.cn/api`
**Auth**: V1 无认证（公开读取），管理操作通过 `x-admin-key` header 鉴权

---

## 公开接口

### GET /api/categories

获取校园生活分类列表。

**Response 200**:
```json
{
  "categories": [
    {
      "slug": "food",
      "name": "吃",
      "icon": "UtensilsCrossed",
      "articleCount": 5
    }
  ]
}
```

---

### GET /api/categories/:slug/articles

获取某分类下的已发布文章列表。

**Query Params**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |

**Response 200**:
```json
{
  "articles": [
    {
      "id": "clx...",
      "title": "二食堂三楼麻辣烫实测",
      "summary": "人均15元，推荐指数...",
      "coverImage": "https://...",
      "category": "food",
      "views": 128,
      "likes": 12,
      "publishedAt": "2026-04-06T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 20
}
```

---

### GET /api/articles/:id

获取文章详情。

**Response 200**:
```json
{
  "id": "clx...",
  "title": "二食堂三楼麻辣烫实测",
  "summary": "人均15元，推荐指数...",
  "content": "# 麻辣烫实测\n\n...",
  "coverImage": "https://...",
  "category": "food",
  "views": 128,
  "likes": 12,
  "publishedAt": "2026-04-06T10:00:00Z",
  "createdAt": "2026-04-05T08:00:00Z",
  "updatedAt": "2026-04-06T09:00:00Z"
}
```

**Response 404**:
```json
{
  "error": "NOT_FOUND",
  "message": "文章不存在"
}
```

---

### GET /api/articles/search

关键词搜索校园内容。

**Query Params**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| category | string | 否 | 限定分类 |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |

**Response 200**: 同分类文章列表格式。

---

### GET /api/articles/featured

获取推荐/精选文章（首页展示用）。

**Query Params**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量，默认 6 |

**Response 200**: 文章列表（摘要级别）。

---

## 管理接口（需要 x-admin-key）

### POST /api/admin/articles

创建文章。

**Headers**: `x-admin-key: <key>`（从环境变量读取）

**Body**:
```json
{
  "title": "二食堂三楼麻辣烫实测",
  "summary": "人均15元，推荐指数...",
  "content": "# 麻辣烫实测\n\n...",
  "coverImage": "https://...",
  "category": "food",
  "status": "draft"
}
```

**Response 201**: 返回创建的文章。

---

### PUT /api/admin/articles/:id

更新文章。

**Response 200**: 返回更新后的文章。

---

### DELETE /api/admin/articles/:id

删除文章。

**Response 200**:
```json
{
  "deleted": true
}
```

---

## 错误格式

所有接口统一错误响应：

```json
{
  "error": "ERROR_CODE",
  "message": "人类可读的错误说明"
}
```

| HTTP Status | error | 说明 |
|-------------|-------|------|
| 400 | VALIDATION_ERROR | 请求参数校验失败 |
| 401 | UNAUTHORIZED | 缺少管理密钥 |
| 403 | FORBIDDEN | 管理密钥无效 |
| 404 | NOT_FOUND | 资源不存在 |
| 500 | INTERNAL_ERROR | 服务端错误 |
