import { Tool, Article } from '@/types';
import { AISearchResultV2, AISolutionResult, FallbackReason } from '@ns/shared';
import { buildFallbackResult } from './aiFallback';
import { API_ENDPOINTS } from '@ns/shared';
import { safeParseJsonObject, ZhipuChatResponse, normalizeStringArray, isRecord } from '@ns/shared';

const ZHIPU_MODEL = 'glm-4-flash';
const EMIT_SEARCH_RESULT_TOOL_NAME = 'emit_search_result_v2';

export const searchToolsWithAI = async (
  query: string, 
  availableTools: Tool[],
  availableArticles: Article[]
): Promise<AISearchResultV2> => {
  try {
    const toolContext = availableTools.map(t => `${t.name}: ${t.description}`).join('\n');
    const articleContext = availableArticles.map(a => `${a.title}: ${a.summary}`).join('\n');
    
    const userPrompt = `用户查询: "${query}"

可用工具库:
${toolContext}

可用文章库:
${articleContext}

请分析用户需求并仅输出 JSON（必须使用中文），包含字段：
1. summary
2. recommendation
3. suggestedTools（最多 3 个工具名称）
4. suggestedArticles（最多 2 个文章标题）

禁止输出 markdown 代码块。`;

    const functionTools = [
      {
        type: 'function',
        function: {
          name: EMIT_SEARCH_RESULT_TOOL_NAME,
          description: '输出盘根指南针 AI 搜索结果（仅结构化数据）',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              recommendation: { type: 'string' },
              suggestedTools: {
                type: 'array',
                items: { type: 'string' },
              },
              suggestedArticles: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['summary', 'recommendation', 'suggestedTools', 'suggestedArticles'],
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
          { role: 'system', content: '你是一位名为“盘根指南针”的专业 AI 软件顾问。' },
          { role: 'user', content: userPrompt },
        ],
        tools: functionTools,
        tool_choice: {
          type: 'function',
          function: {
            name: EMIT_SEARCH_RESULT_TOOL_NAME,
          },
        },
        temperature: 0.2,
      }),
    });
 
    if (!response.ok) {
      const reason = response.status === 401 || response.status === 403 || response.status === 404 ? 'missing_key' : 'network_error';
      return buildFallbackResult(reason, query, availableTools, availableArticles);
    }
 
    const payload: unknown = await response.json();
    const msg = (payload as ZhipuChatResponse).choices?.[0]?.message;

    const toolArgsValue = msg?.tool_calls?.[0]?.function?.arguments;
    const toolArguments = typeof toolArgsValue === 'string' ? toolArgsValue : '';

    const contentValue = msg?.content;
    const content = typeof contentValue === 'string' ? contentValue : '';

    const jsonText = toolArguments || content || '{}';
    const parsed = safeParseJsonObject(jsonText);
    const data = isRecord(parsed) ? parsed : {};

    const summary = typeof data.summary === 'string' ? data.summary : '';
    const recommendation = typeof data.recommendation === 'string' ? data.recommendation : '';

    const suggestedToolNames = normalizeStringArray(data.suggestedTools);
    const suggestedArticleTitles = normalizeStringArray(data.suggestedArticles);

    if ((suggestedToolNames.length === 0 && suggestedArticleTitles.length === 0) || !summary) {
      return buildFallbackResult('empty_result', query, availableTools, availableArticles);
    }

    return {
      mode: 'ai',
      fallbackReason: '',
      summary,
      recommendation: recommendation || '请尝试手动浏览我们的目录。',
      suggestedTools: suggestedToolNames.slice(0, 3),
      suggestedArticles: suggestedArticleTitles.slice(0, 2),
    };

  } catch (error) {
    const reason = error instanceof SyntaxError ? 'parse_error' : 'network_error';
    return buildFallbackResult(reason, query, availableTools, availableArticles);
  }
};

// ===== AI 方案生成 =====

const EMIT_SOLUTION_TOOL_NAME = 'emit_solution_v1';

export const buildFallbackSolution = (
  reason: FallbackReason,
  goal: string,
  tools: Tool[]
): AISolutionResult => {
  const toolNames = tools.map(t => t.name).join('、');

  const intro =
    reason === 'quota_exhausted'
      ? '今日 AI 额度已用完，已为你提供不消耗次数的基础方案草稿。'
      : 'AI 服务不可用，以下为默认建议。';

  const outro =
    reason === 'quota_exhausted'
      ? '> 明日 00:00 自动恢复额度。'
      : '> 请稍后重试以获取更专业的 AI 分析。';

  return {
    mode: 'demo',
    fallbackReason: reason,
    title: `方案: ${toolNames}`,
    aiAdvice: `### 演示模式

${intro}

#### 已选工具
${tools.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

#### 建议步骤
1. 熟悉每个工具的基本操作
2. 根据目标“${goal || '探索工具组合'}”设计工作流
3. 尝试将工具组合使用

${outro}`,
  };
};

export const generateSolutionWithAI = async (
  goal: string,
  selectedTools: Tool[]
): Promise<AISolutionResult> => {
  try {
    const toolContext = selectedTools.map(t => `- ${t.name}: ${t.description}`).join('\n');
    const effectiveGoal = goal.trim() || '探索这些工具的组合潜力';

    const userPrompt = `用户目标: "${effectiveGoal}"

已选工具:
${toolContext}

请生成一份完整的解决方案，包含:
1. 方案标题（简短有力）
2. 详细的 AI 建议（Markdown 格式，包含步骤、优势分析、实施建议等）

要求:
- 必须使用中文
- 建议内容要具体、可执行
- 步骤数量 3-5 个
- 输出纯 JSON，禁止 markdown 代码块`;

    const functionTools = [
      {
        type: 'function',
        function: {
          name: EMIT_SOLUTION_TOOL_NAME,
          description: '输出盘根指南针 AI 方案生成结果',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: '方案标题' },
              aiAdvice: { type: 'string', description: 'AI 建议，Markdown 格式' },
            },
            required: ['title', 'aiAdvice'],
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
          { role: 'system', content: '你是一位名为“盘根指南针”的专业 AI 软件顾问，擅长制定工具组合使用方案。' },
          { role: 'user', content: userPrompt },
        ],
        tools: functionTools,
        tool_choice: {
          type: 'function',
          function: {
            name: EMIT_SOLUTION_TOOL_NAME,
          },
        },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const reason = response.status === 401 || response.status === 403 || response.status === 404 ? 'missing_key' : 'network_error';
      return buildFallbackSolution(reason, effectiveGoal, selectedTools);
    }

    const payload: unknown = await response.json();
    const msg = (payload as ZhipuChatResponse).choices?.[0]?.message;

    const toolArgsValue = msg?.tool_calls?.[0]?.function?.arguments;
    const toolArguments = typeof toolArgsValue === 'string' ? toolArgsValue : '';

    const contentValue = msg?.content;
    const content = typeof contentValue === 'string' ? contentValue : '';

    const jsonText = toolArguments || content || '{}';
    const parsed = safeParseJsonObject(jsonText);
    const data = isRecord(parsed) ? parsed : {};

    const title = typeof data.title === 'string' ? data.title : '';
    const aiAdvice = typeof data.aiAdvice === 'string' ? data.aiAdvice : '';

    if (!title || !aiAdvice) {
      return buildFallbackSolution('empty_result', effectiveGoal, selectedTools);
    }

    return {
      mode: 'ai',
      fallbackReason: '',
      title,
      aiAdvice,
    };

  } catch (error) {
    const reason = error instanceof SyntaxError ? 'parse_error' : 'network_error';
    return buildFallbackSolution(reason, goal, selectedTools);
  }
};
