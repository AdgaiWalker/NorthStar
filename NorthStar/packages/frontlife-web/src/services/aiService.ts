import { CampusArticle } from '@ns/shared';
import { API_ENDPOINTS } from '@ns/shared';
import { safeParseJsonObject, ZhipuChatResponse, normalizeStringArray, checkSensitiveWords } from '@ns/shared';

const ZHIPU_MODEL = 'glm-4-flash';
const EMIT_CAMPUS_RESULT_TOOL_NAME = 'emit_campus_result';

export interface CampusAISearchResult {
  recommendedArticleIds: string[];
  summary: string;
  mode: 'ai' | 'fallback';
  fallbackReason?: string;
}

/**
 * 使用 AI 搜索校园文章
 * @param query 搜索关键词
 * @param campusArticles 校园文章列表
 * @returns 搜索结果，包含推荐文章 ID 和摘要
 */
export const searchCampusWithAI = async (
  query: string,
  campusArticles: CampusArticle[]
): Promise<CampusAISearchResult> => {
  try {
    // 构建文章上下文
    const articleContext = campusArticles
      .map((a) => `${a.id}: ${a.title} - ${a.summary}`)
      .join('\n');

    const userPrompt = `用户问题: "${query}"

以下是校园生活指南中的所有文章：

${articleContext}

请根据用户问题，推荐最相关的 3-5 篇文章。

请以 JSON 格式输出（禁止使用 markdown 代码块）：
{
  "recommendedArticleIds": ["文章ID1", "文章ID2"],
  "summary": "对推荐内容的简要说明"
}

要求：
- 必须使用中文
- recommendedArticleIds 是文章 ID 数组
- summary 要简洁，50 字以内`;

    const functionTools = [
      {
        type: 'function',
        function: {
          name: EMIT_CAMPUS_RESULT_TOOL_NAME,
          description: '输出校园生活顾问 AI 搜索结果',
          parameters: {
            type: 'object',
            properties: {
              recommendedArticleIds: {
                type: 'array',
                items: { type: 'string' },
                description: '推荐的文章 ID 数组',
              },
              summary: {
                type: 'string',
                description: '对推荐内容的简要说明',
              },
            },
            required: ['recommendedArticleIds', 'summary'],
          },
        },
      },
    ];

    const response = await fetch(API_ENDPOINTS.ZHIPU_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ZHIPU_MODEL,
        messages: [
          {
            role: 'system',
            content:
              '你是一位名为"校园生活顾问"的专业 AI 助手，专门帮助大学生解决校园生活中的实际问题，如找美食、省钱购物、出行路线、社团活动、避免踩坑等。',
          },
          { role: 'user', content: userPrompt },
        ],
        tools: functionTools,
        tool_choice: {
          type: 'function',
          function: {
            name: EMIT_CAMPUS_RESULT_TOOL_NAME,
          },
        },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      // API 调用失败，使用基础关键词匹配
      return fallbackKeywordSearch(query, campusArticles, 'network_error');
    }

    const payload: unknown = await response.json();
    const msg = (payload as ZhipuChatResponse).choices?.[0]?.message;

    const toolArgsValue = msg?.tool_calls?.[0]?.function?.arguments;
    const toolArguments = typeof toolArgsValue === 'string' ? toolArgsValue : '';

    const contentValue = msg?.content;
    const content = typeof contentValue === 'string' ? contentValue : '';

    const jsonText = toolArguments || content || '{}';
    const parsed = safeParseJsonObject(jsonText);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return fallbackKeywordSearch(query, campusArticles, 'parse_error');
    }

    const data = parsed as Record<string, unknown>;
    const recommendedIds = normalizeStringArray(data.recommendedArticleIds);
    const summary = typeof data.summary === 'string' ? data.summary : '';

    if (recommendedIds.length === 0 || !summary) {
      return fallbackKeywordSearch(query, campusArticles, 'empty_result');
    }

    // 验证文章 ID 是否存在
    const validIds = recommendedIds.filter((id) =>
      campusArticles.some((a) => a.id === id)
    );

    // 输出过滤：AI summary 命中敏感词则降级
    if (checkSensitiveWords(summary).hit) {
      return fallbackKeywordSearch(query, campusArticles, 'sensitive_output');
    }

    return {
      recommendedArticleIds: validIds,
      summary,
      mode: 'ai',
    };
  } catch {
    return fallbackKeywordSearch(query, campusArticles, 'network_error');
  }
};

/**
 * 基础关键词搜索（降级方案）
 */
const fallbackKeywordSearch = (
  query: string,
  campusArticles: CampusArticle[],
  reason: string
): CampusAISearchResult => {
  const q = query.toLowerCase();

  // 匹配标题和摘要
  const matched = campusArticles
    .filter((a) => {
      if (!a.publishedAt) return false;
      const titleMatch = a.title.toLowerCase().includes(q);
      const summaryMatch = a.summary.toLowerCase().includes(q);
      const contentMatch = a.content.toLowerCase().includes(q);
      return titleMatch || summaryMatch || contentMatch;
    })
    .sort((a, b) => {
      // 优先按标题匹配排序
      const aTitle = a.title.toLowerCase().includes(q) ? 1 : 0;
      const bTitle = b.title.toLowerCase().includes(q) ? 1 : 0;
      if (aTitle !== bTitle) return bTitle - aTitle;
      // 再按阅读量排序
      return b.views - a.views;
    })
    .slice(0, 5);

  const ids = matched.map((a) => a.id);

  return {
    recommendedArticleIds: ids,
    summary:
      ids.length > 0
        ? `为你找到 ${ids.length} 篇相关校园生活指南`
        : '未找到相关内容，试试其他关键词',
    mode: 'fallback',
    fallbackReason: reason,
  };
};
