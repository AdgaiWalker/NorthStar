import { GoogleGenAI } from "@google/genai";
import { Tool, Article } from '../types';
import { AISearchResultV2 } from './aiContract';
import { buildFallbackResult } from './aiFallback';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const searchToolsWithAI = async (
  query: string, 
  availableTools: Tool[],
  availableArticles: Article[]
): Promise<AISearchResultV2> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing. Returning fallback response.");
    return buildFallbackResult('missing_key', query, availableTools, availableArticles);
  }

  try {
    const toolContext = availableTools.map(t => `${t.name}: ${t.description}`).join('\n');
    const articleContext = availableArticles.map(a => `${a.title}: ${a.summary}`).join('\n');
    
    const prompt = `
      你是一位名为“盘根指南针”的专业 AI 软件顾问。
      用户查询: "${query}"
      
      可用工具库:
      ${toolContext}
      
      可用文章库:
      ${articleContext}
      
      请分析用户的需求并提供一个 JSON 响应（**必须使用中文回答**），包含以下字段：
      1. summary: 对用户问题的简短理解和总结（中文）。
      2. recommendation: 关于如何处理此任务的战略建议（中文）。
      3. suggestedTools: 最符合需求的工具名称列表（最多 3 个）。
      4. suggestedArticles: 最符合需求的文章标题列表（最多 2 个）。
      
      请仅以 JSON 格式响应，不要包含 markdown 代码块。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    const tools = Array.isArray(data.suggestedTools)
      ? data.suggestedTools.map((t: unknown) => String(t)).filter(Boolean)
      : [];
    const articles = Array.isArray(data.suggestedArticles)
      ? data.suggestedArticles.map((a: unknown) => String(a)).filter(Boolean)
      : [];

    if ((tools.length === 0 && articles.length === 0) || !data.summary) {
      return buildFallbackResult('empty_result', query, availableTools, availableArticles);
    }

    return {
      mode: 'ai',
      fallbackReason: '',
      summary: data.summary,
      recommendation: data.recommendation || "请尝试手动浏览我们的目录。",
      suggestedTools: tools.slice(0, 3),
      suggestedArticles: articles.slice(0, 2)
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    const reason = error instanceof SyntaxError ? 'parse_error' : 'network_error';
    return buildFallbackResult(reason, query, availableTools, availableArticles);
  }
};
