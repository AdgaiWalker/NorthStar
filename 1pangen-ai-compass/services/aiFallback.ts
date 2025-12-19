import { Tool, Article } from '../types';
import { AISearchResultV2, FallbackReason } from './aiContract';

export const buildFallbackResult = (
  reason: FallbackReason,
  query: string,
  availableTools: Tool[],
  availableArticles: Article[]
): AISearchResultV2 => {
  const normalized = query.trim().toLowerCase();
  const matchedTools = normalized
    ? availableTools.filter(t => t.name.toLowerCase().includes(normalized))
    : [];

  const sortedTools = [
    ...matchedTools,
    ...availableTools
      .filter(t => !matchedTools.includes(t))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  ];

  const toolNames = Array.from(new Set(sortedTools.map(t => t.name))).slice(0, 3);

  const featuredArticles = availableArticles.filter(a => a.isFeatured);
  const orderedArticles = [...featuredArticles, ...availableArticles.filter(a => !a.isFeatured)];
  const articleTitles = orderedArticles.map(a => a.title).slice(0, 2);

  return {
    mode: 'demo',
    fallbackReason: reason,
    summary: "演示模式：AI 服务不可用，基于评分与关键词提供推荐结果。",
    recommendation: "请先查看以下工具与教程，如需更精准建议，请稍后再试。",
    suggestedTools: toolNames,
    suggestedArticles: articleTitles
  };
};
