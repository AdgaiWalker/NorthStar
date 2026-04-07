
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin' | 'creator' | 'superadmin' | 'editor' | 'reviewer';
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

export type Language = 'zh' | 'en';

// 导出格式
export type ExportFormat = 'md' | 'txt' | 'csv';

// 学生认证状态
export type CertificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

// 学生认证信息
export interface StudentCertification {
  status: CertificationStatus;
  schoolId?: string;
  schoolName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

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

// ---- 内容管理（本地 mock）数据模型 ----
// 注意：避免与上方已有枚举重名，使用 ContentStatus/ContentVisibility 等新类型名。
export type ContentStatus = 'draft' | 'published';
export type ContentVisibility = 'public' | 'campus';

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
  createdAt: string; // ISO
  updatedAt: string; // ISO
  publishedAt?: string; // ISO
  stats: { views: number; likes: number };
  folder?: string; // 虚拟文件夹路径，例如 "/创作/AI教程"
  sortIndex?: number; // 排序索引
}

export interface ContentAsset {
  id: string;
  mime: string;
  size: number; // bytes
  dataUrl: string; // base64 data URL
  createdAt: string; // ISO
}

// 文件夹元数据（用于虚拟文件树与领域继承）
export interface FolderMeta {
  path: string;       // 文件夹路径，例如 "/创作"
  domain?: Domain;    // 绑定的领域（可选，用于继承）
  sortIndex?: number; // 排序索引
  createdAt: string;  // ISO 时间
}
