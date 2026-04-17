export type AISearchMode = 'ai' | 'demo';

export type FallbackReason =
  | 'missing_key'
  | 'network_error'
  | 'parse_error'
  | 'empty_result'
  | 'quota_exhausted'
  | 'sensitive_blocked'
  | 'sensitive_output'
  | '';

export interface AISearchResultV2 {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  summary: string;
  recommendation: string;
  suggestedTools: string[];
  suggestedArticles: string[];
}

export interface AISolutionResult {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  title: string;
  aiAdvice: string;
}
