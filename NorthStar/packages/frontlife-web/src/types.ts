import type { CampusArticle, CampusTopic } from '@ns/shared';

// Re-export shared types
export type { CampusArticle, CampusTopic };

// Local view types
export type FeedItemType = 'post' | 'article' | 'kb';

export interface FeedPost {
  id: string;
  authorId: string;
  time: string;
  content: string;
  tags: PostTag[];
  saves: number;
  views: number;
  replies: Reply[];
  images?: string[];
  kbId: string; // 所属知识库
}

export type PostTag = 'help' | 'secondhand' | 'event' | 'discussion' | 'share';

export interface Reply {
  id: string;
  authorId: string;
  time: string;
  text: string;
  stars: number;
}

export interface FeedArticleUpdate {
  articleId: string;
  kbId: string;
  updatedBy: string;
  time: string;
}

export interface FeedKBUpdate {
  kbId: string;
  newArticle: string;
  updatedBy: string;
  time: string;
}

export type FeedItem =
  | { type: 'post'; data: FeedPost; lastActivityAt: number }
  | { type: 'article'; data: FeedArticleUpdate; lastActivityAt: number }
  | { type: 'kb'; data: FeedKBUpdate; lastActivityAt: number };

export interface KnowledgeBase {
  id: string;
  iconName: string;
  name: string;
  desc: string;
  authorId: string;
  articles: string[];
  saves: number;
  views: number;
  section: string;
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  school: string;
  level: number;
}

export type TrustLevel = 1 | 2 | 3 | 4;
