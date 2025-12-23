# Spec-文档系统-混排块与双链

版本：v0.1
日期：2025-12-23
状态：生效

## 1. 目标与范围
本规格定义「盘根 · AI 指南针」的文档系统（Doc）在 V1 前端演示版中的实现标准。

本规格覆盖的能力包含：
- Markdown 渲染（基础语法 + GFM）
- 受控块（白名单）
  - 视频块（video）
  - 提示块（callout，Obsidian 风格）
- 目录（TOC）生成与跳转
- 双链（WikiLink，`[[...]]`）渲染（doc/tool/solution）

本规格不覆盖的能力包含：
- 编辑器输入与联想（例如输入 `[[` 弹出候选列表）
- 反向链接（Backlinks）与知识图谱
- 生产级内容存储、版本管理、权限控制

## 2. 术语与通俗解释
本节对专业名词给出可理解解释。

- Markdown：一种用纯文本写排版结构的格式，例如 `# 标题`、`- 列表`。
- GFM（GitHub Flavored Markdown）：Markdown 的常见扩展，支持表格等能力。
- 受控块（Controlled Blocks）：允许在 Markdown 中使用的“自定义块”，但只允许白名单语法，避免随意插入不安全 HTML。
- TOC（Table of Contents）：目录。根据标题层级（H1–H6）生成可点击的目录。
- slug（锚点 ID）：把标题文本转换成 URL/页面内部可跳转的 id，例如“安装依赖”→ `安装依赖`（再规范化成 `安装依赖`/`an-zhuang-yi-lai` 等）。本项目将 slug 用于目录跳转。
- 双链（WikiLink）：形如 `[[某篇文档]]` 的链接写法，常见于 Obsidian。

## 3. 数据结构
### 3.1 TOC 数据结构
TOC 条目结构与实现一致：

- TocItem
  - depth：标题级别，取值 1–6
  - id：标题锚点（slug）
  - text：标题纯文本

代码对应：`pangen-ai-compass/src/utils/docMarkdown.ts`。

### 3.2 Slugger（锚点生成器）规则
锚点生成器必须满足以下规则：
- 输入：标题文本 rawText
- 输出：稳定可复用的 id
- 规范化规则：
  - 转小写
  - 以 `-` 替换空白
  - 合并连续 `-`
  - 去掉首尾 `-`
  - 若规范化后为空，使用兜底值 `section`
- 重复标题规则：
  - 同一页面内重复标题必须产生不同 id
  - 第一次出现使用基础 id
  - 第二次出现使用 `${base}-2`
  - 第三次出现使用 `${base}-3`，以此类推

代码对应：`pangen-ai-compass/src/utils/docMarkdown.ts` 的 `createSlugger()`。

## 4. Markdown 预处理流水线（从文本到可渲染结构）
文档渲染必须按顺序执行以下流水线：

1) 原始 Markdown（来自内容库字段 `content`）
2) 受控块预处理：`preprocessDocMarkdown(markdown)`
3) 双链预处理：`preprocessWikiLinks(markdown)`
4) Markdown 渲染：ReactMarkdown + remarkGfm

代码对应：
- 受控块预处理：`pangen-ai-compass/src/utils/docMarkdown.ts`
- 双链预处理：`pangen-ai-compass/src/utils/wikilink.ts`
- 渲染组件：`pangen-ai-compass/src/components/DocRenderer.tsx`

## 5. 受控块（白名单）
### 5.1 视频块（video）
#### 5.1.1 用户侧语法
视频块必须使用单行语法：

`:::video{src="https://.../demo.mp4" caption="可选说明"}:::`

属性规则：
- src：必填
- caption：可选
- 属性必须使用双引号包裹

#### 5.1.2 预处理转换规则
当一行完全匹配以下模式时，必须被识别为视频块：

- 以 `:::video{` 开头
- 以 `}:::` 结尾
- 中间为属性字符串

识别成功后必须转换为 fenced code block（代码围栏）：

```text
```pangen-video
src=https://.../demo.mp4
caption=可选说明
```
```

说明：
- fenced code block 的语言标识必须是 `pangen-video`
- 内容为多行 `key=value`，只使用 `src` 与 `caption`

代码对应：`pangen-ai-compass/src/utils/docMarkdown.ts`。

#### 5.1.3 渲染规则
渲染层必须将 `pangen-video` code block 渲染为 HTML5 `<video>`：
- controls 必须开启
- playsInline 必须开启
- preload 必须为 `metadata`

并且：
- caption 存在时必须渲染 figcaption
- caption 不存在时必须不渲染 figcaption

代码对应：`pangen-ai-compass/src/components/DocRenderer.tsx`。

#### 5.1.4 校验规则
src 必须满足以下格式：
- 必须为 https
- 必须为 mp4
- 允许 querystring（例如 `?token=...`）

校验表达式必须与实现一致：
- `^https://.+\.mp4(\?.*)?$`（忽略大小写）

当校验失败时，系统必须渲染错误提示块，明确说明：
- 当前仅支持 https 直链 mp4
- 给出示例语法

### 5.2 提示块（callout，Obsidian 风格）
#### 5.2.1 用户侧语法
提示块必须使用容器语法：

- 开始行：`:::callout{type="tip|warning|info|note|danger|error" title="可选标题"}`
- 结束行：`:::`（单独一行）
- 中间为 Markdown 内容

属性规则：
- type：必填，取值为 `tip|warning|info|note|danger|error`
- title：可选

#### 5.2.2 预处理转换规则
当检测到开始行 `:::callout{...}` 时：
- 系统必须向下寻找最近的闭合行 `:::`
- 系统找到闭合行后必须执行转换
- 系统未找到闭合行时必须放弃转换并原样输出，避免吞掉后续内容

转换后的结构必须是 blockquote 形式，并符合 Obsidian 标准头：

```text
> [!type] 可选标题
>
> 这里是正文
```

代码对应：`pangen-ai-compass/src/utils/docMarkdown.ts`。

#### 5.2.3 渲染规则
渲染层必须识别 blockquote 的第一段是否为：
- `^[!type] title` 的形式

识别成功后必须渲染为 callout 卡片：
- type 决定颜色方案（边框色/背景色/标题色）
- title 为空时必须使用兜底标题“提示”
- 正文必须保持原有 Markdown 渲染结果（段落/列表等）

颜色映射必须与实现一致：
- tip → 绿色系
- warning → 琥珀色系
- danger/error → 红色系
- note → 灰色系
- info（默认）→ 天蓝色系

代码对应：`pangen-ai-compass/src/components/DocRenderer.tsx`。

## 6. 双链（WikiLink）渲染
### 6.1 支持的语法
系统必须支持以下双链写法：

- 文档：
  - `[[标题]]`
  - `[[标题|别名]]`
  - `[[标题#锚点]]`
- 工具：
  - `[[tool:工具ID]]`
  - `[[tool:工具ID|别名]]`
- 方案：
  - `[[solution:方案ID]]`
  - `[[solution:方案ID|别名]]`

代码对应：`pangen-ai-compass/src/utils/wikilink.ts`。

### 6.2 解析规则
解析规则必须与实现一致：
- `tool:` 前缀识别为工具链接
- `solution:` 前缀识别为方案链接
- 其余识别为文档链接
- `|` 之后为 alias（显示文本）
- 文档链接内允许 `#anchor`，并输出 `anchor` 字段

### 6.3 渲染转换规则（预处理阶段）
系统必须在渲染前将 `[[...]]` 转换为标准 Markdown 链接：

- 文档：
  - 存在目标时：`[[Title|Alias]]` → `[Alias](/article/<id>#<anchor>)`
  - 不存在目标时：输出内联提示 `` `未找到：xxx` ``
- 工具：
  - 存在目标时：`[[tool:ID|Alias]]` → `[Alias](/tool/<id>)`
  - 不存在目标时：输出内联提示 `` `未找到：xxx` ``
- 方案：
  - 本期不支持路由跳转，统一输出内联提示 `` `未找到：xxx` ``

目标解析必须与实现一致：
- 文档：通过 `MOCK_ARTICLES` 按 `title === Title` 精确匹配
- 工具：通过 `MOCK_TOOLS` 按 `id === ID` 精确匹配

说明：
- 本期实现以“可预览”为目标，不提供“创建新文档”能力。
- anchor 不做 slug 转换，直接拼接在 `#` 之后。

## 7. 目录（TOC）
### 7.1 生成规则
TOC 生成必须满足：
- 标题来源为 Markdown 的 H1–H6（`#` 到 `######`）
- fenced code block 内的标题必须被忽略
- 标题文本必须去除常见行内 Markdown 语法（链接、行内 code、加粗、斜体）
- id 必须通过同一套 slugger 生成，保证与页面标题 id 一致

代码对应：`pangen-ai-compass/src/utils/docMarkdown.ts` 的 `extractDocToc()`。

### 7.2 展示规则
- 桌面端：阅读页右侧 TOC 常驻
- 移动端：TOC 必须通过按钮打开抽屉（Drawer/Sheet），点击条目后关闭抽屉并滚动

代码对应：`pangen-ai-compass/src/pages/ArticleReadPage.tsx`。

### 7.3 跳转规则
点击目录条目时：
- 系统必须滚动到对应标题元素
- 系统必须更新浏览器 hash 为 `#<id>`

代码对应：`pangen-ai-compass/src/pages/ArticleReadPage.tsx` 的 `scrollToHeading()`。

## 8. 使用位置
文档系统渲染能力必须在以下页面生效：
- 阅读页：`pangen-ai-compass/src/pages/ArticleReadPage.tsx`
- 审核详情页预览：`pangen-ai-compass/src/pages/admin/ReviewDetailPage.tsx`

## 9. 验收标准
本规格的验收标准必须满足：
- 同一文档内出现多个视频块时，系统正确渲染多个 `<video>` 并可分别播放
- 视频 src 非 https 或非 mp4 时，系统显示明确错误提示
- callout 正确渲染为 Obsidian 风格提示块，并正确区分 type
- 同一标题重复出现时，目录与跳转锚点均唯一（例如 `xxx`、`xxx-2`）
- 双链存在时可跳转到对应页面；双链不存在时显示内联提示且不影响其余渲染
- 移动端目录抽屉可打开、可点击、点击后关闭并滚动到标题

## 10. 后续演进（明确边界）
后续版本将按以下顺序演进：
- 增加 editor（编辑器）与 `[[` 联想插入
- 为 `[[未存在文档]]` 提供“创建新文档”入口（Locked → Enabled）
- 引入反向链接（Backlinks）与引用片段
- 扩展视频块能力（支持 iframe、平台视频、转码）
- 引入文档版本管理与审核发布流水线（对接审核工作台）
