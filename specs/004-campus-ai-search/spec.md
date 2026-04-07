# Feature Specification: 校园站接入智谱 AI 智能检索与站间链接

**Feature Branch**: `004-campus-ai-search`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "生活站也要加入智谱的AI智能检索功能" + "如何链接到AI站"

## 背景

全球站（xyzidea.com）已接入智谱 GLM-4-Flash AI 搜索，校园站（xyzidea.cn）目前只有纯前端本地关键词过滤搜索。用户要求：
1. 校园站也接入智谱 AI 智能检索，让用户可以用自然语言提问（如"食堂哪个窗口好吃"）
2. 校园站和全球站之间有明确的导航链接，用户可互相跳转

### 全球站 AI 搜索现状

全球站的 AI 搜索链路：
- 用户输入自然语言 → 前端调用 `/__zhipu/chat/completions` 代理 → 智谱 GLM-4-Flash
- 使用 function calling（`emit_search_result_v2`）返回结构化 JSON
- 返回字段：summary（AI 总结）、recommendation（建议路径）、suggestedTools、suggestedArticles
- 有 fallback 机制：API 不可用时自动降级为本地搜索
- 有游客额度限制（每日 AI 搜索次数上限）

### 校园站 AI 搜索设计

校园站没有"工具"概念，AI 搜索只需要匹配"文章"和"专题"：

| 全球站 AI 搜索 | 校园站 AI 搜索 |
|---------------|---------------|
| 匹配工具 + 文章 | 匹配文章 + 专题 |
| 推荐工具 → ToolCard | 推荐专题 → TopicCard |
| 推荐文章 → ArticleCard | 推荐文章 → ArticleCard |
| 系统提示：AI 软件顾问 | 系统提示：校园生活顾问 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI 智能搜索 (Priority: P1)

用户在校园站首页搜索框输入自然语言问题（如"食堂哪个窗口好吃"或"新生报到要带什么"），系统调用智谱 AI 分析用户意图，返回 AI 总结 + 推荐文章/专题列表。

**Why this priority**: 这是核心功能，直接提升校园站的内容发现能力。没有 AI 搜索，搜索框就只是简单的关键词过滤。

**Independent Test**: 首页搜索框输入"食堂哪个窗口好吃" → 看到 AI 总结文本 + 推荐的文章卡片。

**Acceptance Scenarios**:

1. **Given** 用户在首页, **When** 在搜索框输入"食堂哪个窗口好吃"并提交, **Then** 系统调用智谱 AI，显示 AI 总结文本（如"根据内容推荐以下食堂测评文章"）+ 匹配的文章/专题卡片
2. **Given** AI 搜索完成, **When** 查看结果, **Then** 显示 AI 推荐方案区（summary + recommendation）+ 推荐文章列表 + 推荐专题列表
3. **Given** 智谱 API 不可用, **When** 用户提交搜索, **Then** 自动降级为本地关键词搜索，显示降级提示
4. **Given** 用户在搜索框, **When** 切换 AI/普通搜索模式, **Then** AI 模式显示 Sparkles 图标，普通模式显示 Search 图标
5. **Given** 搜索结果展示, **When** 点击"关闭搜索结果", **Then** 搜索框清空，恢复首页默认内容

---

### User Story 2 - 站间导航链接 (Priority: P2)

用户在校园站 Header 看到"AI 工具"链接，点击后跳转到全球站。同样，全球站用户也可以看到"校园生活"链接跳转到校园站。

**Why this priority**: 两个站点是同一产品的两个面，用户应该可以自由切换。P2 是因为它不影响核心功能但提升产品完整性。

**Independent Test**: 校园站 Header 可见全球站链接 → 点击跳转到 xyzidea.com。

**Acceptance Scenarios**:

1. **Given** 用户在校园站, **When** 查看 Header 右侧, **Then** 看到外部链接按钮指向全球站
2. **Given** 用户在校园站, **When** 点击全球站链接, **Then** 在新标签页打开 xyzidea.com
3. **Given** 校园站 AI 搜索结果中, **When** AI 判断用户问题更适合全球站内容（如"AI 视频剪辑工具推荐"）, **Then** 在搜索结果中提示"在 AI 工具站查看更多"

### Edge Cases

- 智谱 API 响应超时（>10 秒）：显示加载中，超时后降级为本地搜索
- 智谱 API Key 未配置：静默降级为本地搜索，不显示错误
- 搜索结果为空：显示"没有找到相关内容，试试其他关键词？"
- 移动端 AI 搜索结果布局适配
- 游客 AI 搜索额度用尽：降级为演示模式，显示额度提示

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 校园站首页搜索框必须支持 AI 智能搜索模式，通过智谱 GLM-4-Flash 分析用户自然语言查询
- **FR-002**: 校园站必须复用全球站的智谱 API 代理端点（`/__zhipu/chat/completions`），使用相同的认证和调用方式
- **FR-003**: AI 搜索系统提示必须定位为"校园生活顾问"，与全球站的"AI 软件顾问"区分
- **FR-004**: AI 搜索结果必须包含：AI 总结（summary）、建议路径（recommendation）、推荐文章列表（suggestedArticles）、推荐专题列表（suggestedTopics）
- **FR-005**: 系统必须在 AI 搜索和本地关键词搜索之间提供切换按钮，与全球站搜索框样式一致
- **FR-006**: 系统必须在智谱 API 不可用时自动降级为本地关键词搜索，显示降级提示
- **FR-007**: 校园站 Header 必须提供指向全球站（xyzidea.com）的外部链接
- **FR-008**: 搜索框样式必须与全球站 AISearch 组件保持视觉一致（圆角、图标、提交按钮）
- **FR-009**: AI 搜索结果必须以展开面板形式显示（搜索框下方展开），包含 AI 方案区 + 推荐文章 + 推荐专题
- **FR-010**: 系统必须实现游客 AI 搜索额度限制，额度用尽后降级为演示模式

### Key Entities

- **CampusAISearchResult**: AI 搜索结果。字段：mode(ai/demo)、summary、recommendation、suggestedArticles(标题列表)、suggestedTopics(标题列表)、fallbackReason。
- **CampusAIService**: 校园站 AI 搜索服务。调用智谱 API，传入校园文章/专题上下文，解析 function calling 返回结果。与全球站 AIService 类似但系统提示和匹配逻辑不同。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户输入自然语言查询（如"食堂哪个窗口好吃"），AI 搜索在 5 秒内返回包含总结和推荐内容的结果
- **SC-002**: AI 不可用时自动降级为本地搜索，用户无感知中断（降级提示出现，搜索结果仍可展示）
- **SC-003**: 校园站 Header 可见全球站链接，点击后正确跳转
- **SC-004**: AI 搜索和本地搜索切换流畅，切换后结果立即更新

## Assumptions

- 校园站和全球站共用同一个 Vite dev server，智谱 API 代理端点可直接复用
- 智谱 API Key 配置在 dev server 代理层，校园站无需额外配置
- 校园站搜索框从当前简单 input 升级为类似全球站 AISearch 的完整组件
- 游客额度机制复用全球站的 quota 工具函数
- 校园站不需要"专业库/综合库"切换（内容量较小，直接全量搜索）
- 003 的布局镜像可能已移除/替换当前搜索框，本 spec 基于镜像后的布局实现
