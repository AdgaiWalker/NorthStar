import type { SiteContext } from './site';

export type BehaviorEventName =
  | 'campus_search'
  | 'campus_search_no_result'
  | 'campus_ai_fallback'
  | 'campus_feedback_helpful'
  | 'campus_feedback_changed'
  | 'campus_post_created'
  | 'campus_reply_created'
  | 'campus_space_visit'
  | 'campus_article_read'
  | 'campus_favorite'
  | 'compass_search'
  | 'compass_solution_generate'
  | 'compass_solution_save'
  | 'compass_solution_export'
  | 'compass_solution_feedback'
  | 'compass_tool_click'
  | 'compass_favorite'
  | 'campus_to_compass_click';

export interface BehaviorEventRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  userId: string | null;
  event: BehaviorEventName;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateBehaviorEventRequest {
  site: Exclude<SiteContext, 'all'>;
  event: BehaviorEventName;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  site: SiteContext;
}
