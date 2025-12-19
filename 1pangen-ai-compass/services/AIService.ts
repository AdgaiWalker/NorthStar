import { Tool, Article } from '../types';
import { AISearchResultV2 } from './aiContract';
import { buildFallbackResult } from './aiFallback';

const ZHIPU_MODEL = 'glm-4.6';
const EMIT_SEARCH_RESULT_TOOL_NAME = 'emit_search_result_v2';

const extractLikelyJson = (text: string): string => {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return text;
  return text.slice(first, last + 1);
};

const safeParseJsonObject = (raw: string): any => {
  const base = extractLikelyJson(String(raw || '')).trim();
  const candidates: string[] = [];

  if (base) candidates.push(base);
  if (base.startsWith('{{')) candidates.push(base.slice(1));
  if (base.endsWith('}}')) candidates.push(base.slice(0, -1));
  if (base.startsWith('{{') && base.endsWith('}}')) candidates.push(base.slice(1, -1));

  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      // ignore
    }
  }

  return JSON.parse(base || '{}');
};

const normalizeStringArray = (value: unknown): string[] => {
  const out: string[] = [];

  const visit = (v: unknown) => {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) out.push(s);
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) visit(item);
      return;
    }
    if (v == null) return;
    const s = String(v).trim();
    if (s) out.push(s);
  };

  visit(value);
  return out;
};

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
 
    const response = await fetch('/__zhipu/chat/completions', {
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
    const toolArguments =
      typeof (payload as any)?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments === 'string'
        ? (payload as any).choices[0].message.tool_calls[0].function.arguments
        : '';

    const content =
      typeof (payload as any)?.choices?.[0]?.message?.content === 'string'
        ? (payload as any).choices[0].message.content
        : '';

    const jsonText = toolArguments || content || '{}';
    const data = safeParseJsonObject(jsonText);

    const suggestedToolNames = normalizeStringArray(data.suggestedTools);
    const suggestedArticleTitles = normalizeStringArray(data.suggestedArticles);

    if ((suggestedToolNames.length === 0 && suggestedArticleTitles.length === 0) || !data.summary) {
      return buildFallbackResult('empty_result', query, availableTools, availableArticles);
    }

    return {
      mode: 'ai',
      fallbackReason: '',
      summary: data.summary,
      recommendation: data.recommendation || "请尝试手动浏览我们的目录。",
      suggestedTools: suggestedToolNames.slice(0, 3),
      suggestedArticles: suggestedArticleTitles.slice(0, 2)
    };

  } catch (error) {
    const reason = error instanceof SyntaxError ? 'parse_error' : 'network_error';
    return buildFallbackResult(reason, query, availableTools, availableArticles);
  }
};
