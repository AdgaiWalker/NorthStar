export type AISearchMode = 'ai' | 'demo';

export type FallbackReason =
  | 'missing_key'
  | 'network_error'
  | 'parse_error'
  | 'empty_result'
  | 'quota_exhausted'
  | '';

export interface AISearchResultV2 {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  summary: string;
  recommendation: string;
  suggestedTools: string[];
  suggestedArticles: string[];
}

// AI 方案生成结果
export interface AISolutionResult {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  title: string;
  aiAdvice: string; // Markdown 格式
}
