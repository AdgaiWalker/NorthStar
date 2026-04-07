# 内容管理规格：Obsidian 编辑器与草稿→发布流（本地 mock）

版本：v1.0
日期：2025-12-24

## 1. 目标与范围
### 1.1 目标（Goals）
本规格定义「内容管理」模块的可用闭环，系统满足单作者（站长）在本地完成内容生产、编辑、保存与发布，并支持公开/校内受众分层字段。

系统达成以下目标：
- 系统提供内容列表与编辑器入口，站长可管理全部内容。
- 系统提供明确的草稿→发布状态机，并支持下架回草稿。
- 系统提供 Obsidian 风格编辑体验的最小落地：大纲 / 编辑 / 预览三栏。
- 系统提供自动保存机制（2 秒防抖），并展示保存状态与字数。
- 系统提供图片粘贴/拖拽导入，并在 Markdown 中插入图片语法。

### 1.2 范围（In Scope）
- 内容类型：仅文章（article）。
- 数据来源：本地 localStorage + 内置种子内容（首次启动落盘）。
- 编辑器：CodeMirror 6（Markdown 语法高亮、换行、快捷保存）。
- 预览：复用前台 DocRenderer（支持 video/callout/wiki links 等受控能力）。

### 1.3 非目标（Non-goals）
- 不接入真实后端（不做数据库、鉴权、对象存储、服务端搜索）。
- 不实现多作者协作、投稿审核队列、批量运营能力。
- 不实现完整的内容元信息体系（作者/置顶/精选位策略等以 tags 约定表达）。

## 2. 信息架构与路由
### 2.1 后台入口与导航
- 后台壳组件：`pangen-ai-compass/src/components/AdminLayout.tsx`
- 后台导航项：内容管理（path：`/admin/content`）

### 2.2 路由结构
路由文件：`pangen-ai-compass/src/routes.tsx`
- `/admin/content`：内容列表页
- `/admin/content/new`：新建草稿（创建后重定向到编辑页）
- `/admin/content/:contentId/edit`：内容编辑页

## 3. 数据模型（ContentItem / ContentAsset）
类型文件：`pangen-ai-compass/src/types.ts`

### 3.1 枚举与基础类型
- `ContentStatus = 'draft' | 'published'`
- `ContentVisibility = 'public' | 'campus'`

### 3.2 ContentItem（统一内容对象）
字段定义：
- `id: string`：内容唯一 ID（允许复用内置文章 id，如 a1/a2）。
- `type: 'article'`：内容类型固定为文章。
- `title: string`：标题。
- `summary: string`：摘要。
- `coverImageUrl: string`：封面图 URL（允许为空字符串）。
- `domain: 'creative' | 'dev' | 'work'`：领域分区。
- `status: 'draft' | 'published'`：发布状态。
- `visibility: 'public' | 'campus'`：受众可见性。
- `schoolId?: string`：当 visibility=campus 时必须存在且非空。
- `schoolName?: string`：学校名称（用于展示）。
- `tags: string[]`：标签（承载精选/专题等逻辑约定）。
- `relatedToolIds: string[]`：关联工具 ID 列表。
- `markdown: string`：正文 Markdown。
- `createdAt: string`：ISO 时间。
- `updatedAt: string`：ISO 时间。
- `publishedAt?: string`：ISO 时间（仅 published 时存在）。
- `stats: { views: number; likes: number }`：本地统计。

### 3.3 tags 约定（必须遵守）
系统在 V1 采用 tags 表达「精选」与「专题」关系：
- `featured`：表示该文章在首页「精选文章」中展示。
- `topic:<topicId>`：表示该文章属于某个专题（topicId 与 `MOCK_TOPICS` 对齐）。

该约定由内容种子迁移与前台映射共同保证。

### 3.4 ContentAsset（图片资源）
字段定义：
- `id: string`：资源唯一 ID。
- `mime: string`：MIME（image/png 等）。
- `size: number`：字节大小。
- `dataUrl: string`：base64 data URL。
- `createdAt: string`：ISO 时间。

Markdown 引用格式：
- `![alt](dataUrl)`

## 4. 本地存储（localStorage）
存储工具：`pangen-ai-compass/src/utils/storage.ts`

### 4.1 STORAGE_KEYS
- `pangen.content.items`：`ContentItem[]`
- `pangen.content.assets`：`ContentAsset[]`

### 4.2 数据校验与容错
校验函数：`pangen-ai-compass/src/utils/guards.ts`
- `isContentItemArray`
- `isContentAssetArray`

容错策略：
- 校验通过：使用存储值。
- 校验失败：删除损坏值并回退默认值；同时触发一次性 resetDetected（由 store 提供）。

### 4.3 首次启动种子内容
种子来源：`pangen-ai-compass/src/constants.ts` 的 `MOCK_ARTICLES`。

落盘位置：`pangen-ai-compass/src/store/useContentStore.ts`
- 当 `pangen.content.items` 不存在时，系统将 `MOCK_ARTICLES` 映射为 `ContentItem[]` 并写入 localStorage。
- 映射规则：
  - Article.id → ContentItem.id
  - Article.content → ContentItem.markdown
  - Article.imageUrl → ContentItem.coverImageUrl
  - Article.isFeatured / topicId → ContentItem.tags（featured / topic:<topicId>）
  - Article.visibility / schoolId → ContentItem.visibility / schoolId

## 5. Store：useContentStore
文件：`pangen-ai-compass/src/store/useContentStore.ts`

### 5.1 State
- `items: ContentItem[]`
- `assets: ContentAsset[]`
- `storageResetDetected: boolean`

### 5.2 Actions
- `createDraft(opts?: { domain?: Domain }): string`
  - 创建 draft 内容并返回 id。
  - 新建内容默认：title=未命名文章、visibility=public、markdown=''。
- `updateDraft(id, patch)`
  - 更新内容并写入 `updatedAt`。
- `publish(id)`
  - status：draft → published
  - 写入 `publishedAt` 与 `updatedAt`。
- `unpublish(id)`
  - status：published → draft
  - 清空 `publishedAt` 并写入 `updatedAt`。
- `delete(id)`
  - 从 items 删除指定内容。
- `upsertAsset(asset)`
  - assets 按 id upsert。

### 5.3 Selectors
- `getPublishedArticlesByDomain(domain)`：返回指定领域已发布内容。
- `getArticleById(id)`：按 id 返回内容。

## 6. 后台页面规格
### 6.1 内容列表页（/admin/content）
文件：`pangen-ai-compass/src/pages/admin/ContentListPage.tsx`

#### 6.1.1 筛选条件（V1）
- 状态：全部 / 草稿 / 已发布
- 领域：全部 / creative / dev / work
- 可见性：全部 / public / campus
- 关键词：标题 + 摘要模糊匹配

#### 6.1.2 列表字段
- 封面（coverImageUrl 缩略图）
- 标题
- 状态（draft/published）
- 领域（creative/dev/work）
- 可见性（public/campus）
- 更新时间（updatedAt）
- 操作（发布/下架/编辑/删除）

#### 6.1.2 行为
- 点击“新建文章”进入 `/admin/content/new`。
- 点击标题或“编辑”进入 `/admin/content/:id/edit`。
- “发布/下架/删除”均立即生效并写入 localStorage。

### 6.2 内容编辑页（/admin/content/new & /admin/content/:id/edit）
文件：`pangen-ai-compass/src/pages/admin/ContentEditorPage.tsx`

#### 6.2.1 新建行为
- 访问 `/admin/content/new` 时，系统创建草稿并 replace 到 `/admin/content/:id/edit`。

#### 6.2.2 元信息表单
字段：
- 标题（title）
- 摘要（summary）
- 封面 URL（coverImageUrl）
- 领域（domain）
- 可见性（visibility）
- 学校 ID（schoolId，仅 visibility=campus 显示）

#### 6.2.3 发布流
- 草稿态：显示“发布”按钮。
- 已发布：显示“下架”按钮。

## 7. 编辑器能力（Obsidian 风格）
### 7.1 三栏布局
编辑页提供三栏：
- 左栏：大纲（根据 Markdown H1-H6 提取）
- 中栏：编辑器（CodeMirror）
- 右栏：预览（DocRenderer）

### 7.2 大纲（TOC）
TOC 提取函数：`pangen-ai-compass/src/utils/docMarkdown.ts` 的 `extractDocToc(markdown)`。

行为：
- 大纲为空时展示“暂无标题（请添加 # 标题）”。
- 点击大纲项滚动到预览区对应 heading（heading id 由 DocRenderer 生成，算法与 extractDocToc 一致）。

### 7.3 预览（DocRenderer）
预览组件：`pangen-ai-compass/src/components/DocRenderer.tsx`

预览具备以下能力：
- 标准 Markdown + GFM
- 受控块：video、callout
- wiki links（[[...]]）

### 7.4 工具栏与快捷键
编辑器提供基础工具栏：
- 加粗（**...**）
- 斜体（*...*）
- 链接（[text](url)）
- 代码块（```...```）
- H1/H2/H3（在当前行插入 #/##/###）

编辑器支持快捷键：
- `Ctrl/Cmd + S`：立即保存（将当前 markdown 写入 store 并持久化）

### 7.5 自动保存
自动保存策略：
- 文本变化后进入“保存中…”状态。
- 2 秒防抖后写入 `updateDraft(markdown)` 并变为“已保存：{time}”。

### 7.6 字数统计
编辑页底部状态条展示：
- 保存状态：保存中/已保存时间/未保存
- 字数：按空白分词统计（V1 简化口径）

### 7.7 图片粘贴/拖拽
组件：`pangen-ai-compass/src/components/MarkdownEditor.tsx`

规则：
- 支持 paste/drop 的第一张图片文件。
- 单张上限：300KB。
- 超限时提示并拒绝插入。
- 成功导入：
  - 将图片转为 dataURL，插入 `![image](dataUrl)` 到光标处。
  - 同步写入 `ContentAsset` 到 `pangen.content.assets`。

## 8. 内容工作室（/admin/studio）
版本：v1.1 新增

### 8.1 定位与目标
内容工作室是 Obsidian 风格的内容编辑界面，提供文件树导航、Markdown 编辑器、属性检视器三栏布局。

### 8.2 文件夹与领域继承
#### 8.2.1 FolderMeta 数据模型
字段定义：
- `path: string`：文件夹路径，例如 "/创作"
- `domain?: Domain`：绑定的领域（可选）
- `createdAt: string`：ISO 时间

#### 8.2.2 领域继承规则
- 内容默认继承所在文件夹的领域
- 继承向上查找，直到找到绑定了 domain 的文件夹
- 用户可手动覆盖内容的领域

#### 8.2.3 种子文件夹
首次启动时自动创建：
- `/创作` (domain: creative)
- `/开发` (domain: dev)
- `/办公` (domain: work)

### 8.3 三栏布局
- 左栏：文件树 (240px)
- 中栏：Markdown 编辑器 (flex-1)
- 右栏：属性检视器 (280px)

### 8.4 组件规格
#### 8.4.1 FileTree 文件树
文件：`src/components/admin/FileTree.tsx`
功能：文件夹树渲染、内容项显示、领域徽章、新建文章按钮

#### 8.4.2 PropertiesPanel 属性检视器
文件：`src/components/admin/PropertiesPanel.tsx`
结构：基础属性、发布设置、高级属性三个折叠分组

#### 8.4.3 DomainBadge 领域徽章
文件：`src/components/ui/DomainBadge.tsx`
色彩：creative=紫、dev=蓝、work=绿

### 8.5 路由
- `/admin/studio`：内容工作室首页
- `/admin/studio/:contentId`：编辑指定内容

## 9. 验收标准
- 新建文章：进入 `/admin/content/new` 后自动创建草稿并跳转到编辑页。
- 自动保存：持续输入 30 秒后刷新页面，内容保持一致。
- 发布/下架：发布后前台可见；下架后前台不可见且后台仍可编辑。
- 图片：粘贴或拖拽图片后插入 Markdown 图片语法。
- 内容工作室：三栏布局正常显示，文件树可导航，属性面板可编辑。
- 领域继承：新建内容时自动继承文件夹领域。

## 10. 代码对齐清单（Source of Truth）
- types：`pangen-ai-compass/src/types.ts`
- storage：`pangen-ai-compass/src/utils/storage.ts`
- guards：`pangen-ai-compass/src/utils/guards.ts`
- store：`pangen-ai-compass/src/store/useContentStore.ts`
- editor：`pangen-ai-compass/src/components/MarkdownEditor.tsx`
- admin pages：
  - `pangen-ai-compass/src/pages/admin/ContentListPage.tsx`
  - `pangen-ai-compass/src/pages/admin/ContentEditorPage.tsx`
  - `pangen-ai-compass/src/pages/admin/ContentStudioPage.tsx`
- admin components：
  - `pangen-ai-compass/src/components/admin/FileTree.tsx`
  - `pangen-ai-compass/src/components/admin/PropertiesPanel.tsx`
- ui components：
  - `pangen-ai-compass/src/components/ui/CollapsibleSection.tsx`
  - `pangen-ai-compass/src/components/ui/DomainBadge.tsx`
- routes：`pangen-ai-compass/src/routes.tsx`
- admin layout：`pangen-ai-compass/src/components/AdminLayout.tsx`
