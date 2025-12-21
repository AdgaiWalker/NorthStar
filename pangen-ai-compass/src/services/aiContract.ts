export type AISearchMode = 'ai' | 'demo';

export type FallbackReason = 'missing_key' | 'network_error' | 'parse_error' | 'empty_result' | '';

export interface AISearchResultV2 {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  summary: string;
  recommendation: string;
  suggestedTools: string[];
  suggestedArticles: string[];
}
