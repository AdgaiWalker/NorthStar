import type { SiteContext } from './site';

export type SearchScope = 'campus' | 'compass' | 'all';
export type SearchResultType = 'article' | 'post' | 'space' | 'tool' | 'topic' | 'news' | 'solution';

export interface SearchDocumentRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  scope: SearchScope;
  targetType: SearchResultType;
  targetId: string;
  title: string;
  body: string;
  keywords: string[];
  updatedAt: string;
}

export interface UnifiedSearchRequest {
  site: Exclude<SiteContext, 'all'>;
  scope: SearchScope;
  query: string;
  limit?: number;
}

export interface UnifiedSearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  summary: string;
  score: number;
  usedAi: boolean;
}
