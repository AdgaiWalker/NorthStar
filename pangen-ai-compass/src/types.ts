
export type Domain = 'creative' | 'dev' | 'work';

export enum ContentType {
  TOOL = 'Tool',
  EXPERIENCE = 'Experience'
}

export type ExperienceTab = 'featured' | 'plaza';

export interface Topic {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  domain: Domain;
  articleCount: number;
  rating: number;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  domain: Domain;
  tags: string[];
  rating: number; // 0-5
  usageCount: string; // e.g. "1.2k"
  imageUrl: string;
  url: string;
  isFavorite: boolean;
  visibility?: 'public' | 'campus'; // 可见性：公开/校内专区
  schoolId?: string; // 校内专区时的学校标识
}

export interface Article {
  id: string;
  topicId?: string; // Belongs to a topic
  title: string;
  summary: string;
  content: string; // Markdown
  domain: Domain;
  author: string;
  authorLevel?: 'certified' | 'user';
  date: string;
  readTime: string;
  relatedToolId?: string;
  imageUrl: string;
  isVideo: boolean;
  isFeatured: boolean; // For Featured vs Plaza
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  visibility?: 'public' | 'campus'; // 可见性：公开/校内专区
  schoolId?: string; // 校内专区时的学校标识
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin' | 'creator';
  isPro: boolean;
}

export interface UserSolution {
  id: string;
  title: string;
  targetGoal: string;
  toolIds: string[];
  aiAdvice: string; // Markdown content
  createdAt: string;
}

export type ThemeMode = 'light' | 'eye-care';

export type Language = 'zh' | 'en' | 'jp' | 'ru';

// AI 搜索库模式: professional=专业库(精选), comprehensive=综合库(全量)
export type LibraryMode = 'professional' | 'comprehensive';

export type ViewState = 
  | { type: 'home' }
  | { type: 'tool-detail'; toolId: string }
  | { type: 'article-read'; articleId: string; topicId?: string }
  | { type: 'login' }
  | {
      type: 'user-center';
      tab?: 'profile' | 'history' | 'favorites' | 'creator' | 'solutions' | 'stats' | 'settings';
    }
  | { type: 'solution-generate'; toolIds: string[] }
  | {
      type: 'admin';
      section?:
        | 'dashboard'
        | 'content'
        | 'users'
        | 'approvals'
        | 'tools'
        | 'stats'
        | 'payments'
        | 'ai'
        | 'settings'
        | 'analytics';
    };

export interface AnalyticsEvent {
  id: string;
  type: 'ai_search' | 'solution_generate' | 'solution_export' | 'tool_select' | 'domain_switch' | 'page_view';
  timestamp: string;
  domain?: Domain;
  toolIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UserStats {
  aiSearchCount: { total: number; trend: number[] };
  solutionCount: { total: number; trend: number[] };
  exportCount: number;
  topTools: { id: string; name: string; count: number; icon: string }[];
  domainDistribution: { domain: Domain; count: number; label: string; color: string }[];
  trend: { date: string; searches: number; solutions: number }[];
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: { dau: number; wau: number; mau: number };
  aiCalls: { today: number; week: number; successRate: number };
  solutionGenerated: { today: number; week: number };
  topTools: { name: string; usage: number }[];
  topSearchTerms: { term: string; count: number }[];
  trend: { date: string; users: number; aiCalls: number }[];
}
