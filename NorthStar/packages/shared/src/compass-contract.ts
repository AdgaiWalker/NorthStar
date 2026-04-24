import type { Domain, ExportFormat } from './types';

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
}

export interface SolutionExportRequest {
  solutionId: string;
  format: ExportFormat;
}
