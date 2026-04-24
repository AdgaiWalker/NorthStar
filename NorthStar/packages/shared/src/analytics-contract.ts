import type { SiteContext } from './site';

export type BehaviorEventName =
  | 'campus_search'
  | 'campus_feedback_helpful'
  | 'campus_feedback_changed'
  | 'compass_solution_generate'
  | 'compass_solution_save'
  | 'compass_solution_export'
  | 'compass_search'
  | 'campus_to_compass_click';

export interface BehaviorEventRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  userId: string | null;
  event: BehaviorEventName;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  site: SiteContext;
}
