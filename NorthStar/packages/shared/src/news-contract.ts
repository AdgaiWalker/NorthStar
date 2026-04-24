import type { Domain } from './types';

export interface NewsItemRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  domain: Domain;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
}
