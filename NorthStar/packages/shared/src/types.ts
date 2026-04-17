// ===== 共享数据类型（两站通用） =====

// 全球站领域
export type Domain = 'creative' | 'dev' | 'work';

// 校园站领域
export type CampusDomain = 'daily' | 'growth' | 'deal';

// 工具
export interface Tool {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  domain: Domain;
  tags: string[];
  rating: number;
  usageCount: string;
  imageUrl: string;
  url: string;
  isFavorite: boolean;
}

// 专题
export interface Topic {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  domain: Domain;
  articleCount: number;
  rating: number;
}

// 全球站文章
export interface Article {
  id: string;
  topicId?: string;
  title: string;
  summary: string;
  content: string;
  domain: Domain;
  author: string;
  authorLevel?: 'certified' | 'user';
  date: string;
  readTime: string;
  relatedToolId?: string;
  imageUrl: string;
  isVideo: boolean;
  isFeatured: boolean;
  stats: { views: number; likes: number; comments: number };
}

// 校园站文章
export interface CampusArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  topicId?: string;
  visibility?: 'public' | 'campus';
  schoolId?: string;
  views: number;
  likes: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 校园站专题
export interface CampusTopic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  articleIds: string[];
}

// 用户
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin' | 'creator' | 'superadmin' | 'editor' | 'reviewer';
  isPro: boolean;
}

// 用户方案
export interface UserSolution {
  id: string;
  title: string;
  targetGoal: string;
  toolIds: string[];
  aiAdvice: string;
  createdAt: string;
}

// 游客额度
export interface GuestQuotaState {
  aiSearchRemaining: number;
  aiSolutionRemaining: number;
  resetAt: number;
}

// 通用类型
export type ThemeMode = 'light' | 'eye-care';
export type Language = 'zh' | 'en';
export type ExportFormat = 'md' | 'txt' | 'csv';
export type CertificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type LibraryMode = 'professional' | 'comprehensive';
export type ContentStatus = 'draft' | 'published';
export type ContentVisibility = 'public' | 'campus';
export enum ContentType {
  TOOL = 'Tool',
  EXPERIENCE = 'Experience',
}
export type ExperienceTab = 'featured' | 'plaza';

// 学生认证
export interface StudentCertification {
  status: CertificationStatus;
  schoolId?: string;
  schoolName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

// 内容管理
export interface ContentItem {
  id: string;
  type: 'article';
  title: string;
  summary: string;
  coverImageUrl: string;
  domain: Domain;
  status: ContentStatus;
  visibility: ContentVisibility;
  schoolId?: string;
  schoolName?: string;
  tags: string[];
  relatedToolIds: string[];
  markdown: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  stats: { views: number; likes: number };
  folder?: string;
  sortIndex?: number;
}

export interface ContentAsset {
  id: string;
  mime: string;
  size: number;
  dataUrl: string;
  createdAt: string;
}

export interface FolderMeta {
  path: string;
  domain?: Domain;
  sortIndex?: number;
  createdAt: string;
}

// 分析相关
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
  activeUsers: { dau: number; mau: number; wau: number };
  aiCalls: { today: number; week: number; successRate: number };
  solutionGenerated: { today: number; week: number };
  topTools: { name: string; usage: number }[];
  topSearchTerms: { term: string; count: number }[];
  trend: { date: string; users: number; aiCalls: number }[];
}
