# 受众分层规格：公开与校内隔离（access policy）

版本：v1.0
日期：2025-12-24

## 1. 概述
本规格定义系统的「受众分层」与访问控制策略，系统通过内容字段表达可见性，并在列表层与详情层同时执行访问控制，保证校内内容不可被绕过。

系统将“领域（domain）”与“受众（visibility/schoolId）”定义为两个正交维度：
- domain 决定内容属于哪个领域分区（creative/dev/work）。
- visibility/schoolId 决定内容可见人群（公开/校内）。

## 2. 术语与对象
### 2.1 受众可见性
- public：公开内容，所有用户可访问。
- campus：校内内容，只有通过学生认证且学校匹配的用户可访问。

### 2.2 学生认证对象
类型：`StudentCertification`（见 `openspec/Specs/Spec-用户中心-收藏设置-额度与认证.md`）

关键字段：
- `status: 'none' | 'pending' | 'verified' | 'rejected'`
- `schoolId?: string`

访问控制以以下条件为真时才允许访问校内内容：
- `status === 'verified'`
- `cert.schoolId === content.schoolId`（完全一致）

### 2.3 内容对象（统一可见性字段）
本规格覆盖以下对象的可见性字段：
- Tool（工具）：`visibility?: 'public' | 'campus'`，`schoolId?: string`（见 `openspec/Specs/Spec-校内专区-访问控制与演示数据.md`）
- ContentItem（文章）：`visibility: 'public' | 'campus'`，`schoolId?: string`（见 `openspec/Specs/Spec-内容管理-Obsidian编辑器与发布流.md`）

## 3. Access Policy（统一判定函数）
### 3.1 函数定义
文件：`pangen-ai-compass/src/utils/access.ts`

函数：`canAccessContent(meta, cert): boolean`
- 输入：
  - `meta.visibility?: string`
  - `meta.schoolId?: string`
  - `cert: StudentCertification`
- 输出：
  - boolean（是否允许访问）

### 3.2 判定规则（肯定句）
- meta.visibility 不等于 campus 时，系统允许访问。
- meta.visibility 等于 campus 时，系统仅在以下条件同时满足时允许访问：
  - cert.status 等于 verified。
  - cert.schoolId 存在且与 meta.schoolId 完全一致。

## 4. 列表层访问控制（过滤）
### 4.1 首页（HomePage）
文件：`pangen-ai-compass/src/pages/HomePage.tsx`

规则：
- 首页在展示工具列表、文章列表、AI 搜索结果时，对所有候选项执行 `canAccessContent`。
- 无权访问的校内内容在列表中不可见。

### 4.2 校内专区页（CampusPage）
文件：`pangen-ai-compass/src/pages/CampusPage.tsx`

规则：
- 未认证（status 非 verified）时，页面展示锁定态，不展示任何校内内容列表。
- 已认证且 schoolId 有值时，页面仅展示：
  - visibility=campus 且 schoolId 等于用户 schoolId 的内容。

### 4.3 内容来源与分区
内容来源在 V1 分为两类：
- 工具：来自 `pangen-ai-compass/src/constants.ts` 的 MOCK_TOOLS。
- 文章：来自 `pangen-ai-compass/src/store/useContentStore.ts` 的已发布 ContentItem（包含内置种子与用户新建内容）。

系统保证 domain 与 visibility 的组合逻辑：
- 系统先按 domain 过滤，再按 access policy 过滤。

## 5. 详情层访问控制（直链拦截）
### 5.1 文章详情（ArticleReadPage）
文件：`pangen-ai-compass/src/pages/ArticleReadPage.tsx`

规则：
- 当目标文章为 campus 且 `canAccessContent` 返回 false 时，页面渲染 Locked 视图：
  - 明确说明“校内专属内容”。
  - 主按钮引导至 `/me/certification`。
  - 提供返回首页入口。

### 5.2 工具详情（ToolDetailPage）
工具详情的访问控制与校内专区规格保持一致，系统在工具详情页对 campus 工具执行同等拦截策略。

## 6. 防绕过保证
系统通过以下组合保证不可绕过：
- 列表过滤：用户无法在列表与搜索结果中看到无权访问的校内内容。
- 直链拦截：用户即使通过分享链接打开校内内容，也会被拦截并引导认证。
- 单一判定函数：列表与详情共用 `canAccessContent`，保证策略一致。

## 7. 验收标准
- 普通用户：
  - 首页看不到任何校内内容。
  - 通过直链打开校内文章进入锁定态并可跳转到学生认证。
- 已认证学生（schoolId=heihe）：
  - 首页可见本校校内内容与公开内容。
  - 校内专区页可见本校校内内容。
  - 通过直链打开本校校内文章正常展示。
- 已认证学生（schoolId 不匹配）：
  - 首页与校内专区页均看不到非本校校内内容。
  - 直链访问非本校校内内容进入锁定态。

## 8. 代码对齐清单（Source of Truth）
- access policy：`pangen-ai-compass/src/utils/access.ts`
- 用户认证：`pangen-ai-compass/src/store/useAppStore.ts`
- 首页过滤：`pangen-ai-compass/src/pages/HomePage.tsx`
- 校内专区：`pangen-ai-compass/src/pages/CampusPage.tsx`
- 文章拦截：`pangen-ai-compass/src/pages/ArticleReadPage.tsx`
- 校内专区规格（演示数据与工具拦截）：`openspec/Specs/Spec-校内专区-访问控制与演示数据.md`
- 内容管理规格（文章模型）：`openspec/Specs/Spec-内容管理-Obsidian编辑器与发布流.md`
