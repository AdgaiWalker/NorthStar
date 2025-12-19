
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

export type ViewState = 
  | { type: 'home' }
  | { type: 'tool-detail'; toolId: string }
  | { type: 'article-read'; articleId: string; topicId?: string }
  | { type: 'login' }
  | { type: 'user-center'; tab?: 'profile' | 'history' | 'favorites' | 'creator' | 'solutions' }
  | { type: 'solution-generate'; toolIds: string[] }
  | { type: 'admin'; section?: 'dashboard' | 'content' | 'users' };
