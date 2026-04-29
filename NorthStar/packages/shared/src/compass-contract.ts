import type { Article, Domain, ExportFormat, Tool, Topic } from './types';

export type CompassContentType = 'tool' | 'topic' | 'article' | 'news';
export type CompassContentStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export interface CompassContentRecord {
  id: string;
  slug: string;
  contentType: CompassContentType;
  title: string;
  summary: string;
  body: string;
  domain: Domain | null;
  metadata: Record<string, unknown>;
  status: CompassContentStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface CompassContentListResponse<T> {
  items: T[];
}

export interface CompassToolRecord {
  id: string;
  slug: string;
  name: string;
  domain: Domain;
  summary: string;
  tags: string[];
  url: string;
  isActive: boolean;
  updatedAt: string;
}

export type CompassToolDetail = Tool & {
  slug: string;
  markdown: string;
};

export type CompassTopicDetail = Topic & {
  slug: string;
  markdown: string;
};

export type CompassArticleDetail = Article & {
  slug: string;
};

export interface CompassNewsRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  domain: Domain;
  source: string;
  publishedAt: string;
  url?: string;
}

export interface CompassTopicRecord {
  id: string;
  slug: string;
  title: string;
  domain: Domain;
  summary: string;
  updatedAt: string;
}

export interface SolutionRecord {
  id: string;
  userId: string;
  title: string;
  targetGoal: string;
  toolIds: string[];
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSolutionRequest {
  title: string;
  targetGoal: string;
  toolIds: string[];
  content: string;
}

export interface SolutionExportRequest {
  solutionId: string;
  format: ExportFormat;
}

export interface SolutionFeedbackRequest {
  helpful: boolean;
  note?: string;
}

export interface CompassFavoriteRecord {
  id: string;
  targetType: 'tool' | 'article' | 'topic' | 'news';
  targetId: string;
  createdAt: string;
}

export interface ContentVersion {
  id: number;
  contentRecordId: number;
  version: number;
  snapshot: Record<string, unknown>;
  editorId: number | null;
  createdAt: string;
}

export interface CreateContentRequest {
  contentType: CompassContentType;
  slug?: string;
  title: string;
  summary?: string;
  body?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateContentRequest {
  title?: string;
  summary?: string;
  body?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
  status?: CompassContentStatus;
}
