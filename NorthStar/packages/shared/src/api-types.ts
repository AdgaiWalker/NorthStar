export interface SpaceSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  category: string;
  articleCount: number;
  helpfulCount: number;
  favoriteCount: number;
  recentActiveAt: string;
  maintainer: {
    id: string;
    name: string;
  };
}

export interface ArticleSummary {
  id: string;
  slug: string;
  spaceId: string;
  parentId: string | null;
  title: string;
  summary: string;
  helpfulCount: number;
  changedCount: number;
  readCount: number;
  favoriteCount: number;
  confirmedAt: string | null;
  updatedAt: string;
}

export interface ChangeFeedback {
  id: string;
  articleId: string;
  note: string;
  createdAt: string;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  author: {
    id: string;
    name: string;
  };
  space: {
    id: string;
    title: string;
    iconName: string;
  };
  changeNotes: ChangeFeedback[];
}

export interface PostRecord {
  id: string;
  spaceId: string;
  content: string;
  tags: string[];
  author: {
    id: string;
    name: string;
  };
  helpfulCount: number;
  replyCount: number;
  createdAt: string;
  replies?: PostReplyRecord[];
  solved?: boolean;
}

export interface PostReplyRecord {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  starCount: number;
  createdAt: string;
}

export interface CreatePostInput {
  spaceId?: string;
  content: string;
  tags?: string[];
  authorName?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface CreateArticleInput {
  spaceId: string;
  title: string;
  content: string;
  authorName?: string;
}

export interface ArticleDraftResponse {
  reply: string;
  directions: string[];
  draft: {
    title: string;
    content: string;
  };
}

export interface PermissionResponse {
  canPost: boolean;
  canWrite: boolean;
  canCreateSpace: boolean;
}

export type FrontlifeFeedItem =
  | {
      id: string;
      type: 'article';
      createdAt: string;
      articleId: string;
      spaceId: string;
      title: string;
      summary: string;
      actorName: string;
      helpfulCount: number;
    }
  | {
      id: string;
      type: 'post';
      createdAt: string;
      postId: string;
      spaceId: string;
      content: string;
      actorName: string;
      helpfulCount: number;
    }
  | {
      id: string;
      type: 'changed';
      createdAt: string;
      articleId: string;
      title: string;
      note: string;
      actorName: string;
    }
  | {
      id: string;
      type: 'ai';
      createdAt: string;
      query: string;
      answer: string;
    };

export interface FeedResponse {
  items: FrontlifeFeedItem[];
  hasMore: boolean;
}

export interface SearchLogRecord {
  id: string;
  query: string;
  resultCount: number;
  usedAi: boolean;
  createdAt: string;
}

export interface SearchResponse {
  articles: ArticleSummary[];
  posts: PostRecord[];
  spaces: SpaceSummary[];
}

export interface NotificationRecord {
  id: string;
  type: 'auth_invite' | 'feedback' | 'changed' | 'expiry' | 'claim' | 'reply' | 'trust';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface FavoriteRecord {
  id: string;
  targetType: 'article' | 'space';
  targetId: string;
  title: string;
  createdAt: string;
}

export interface ProfileResponse {
  user: {
    id: string;
    name: string;
    school: string;
  };
  stats: {
    helpedCount: number;
    articleCount: number;
    favoriteCount: number;
  };
  spaces: SpaceSummary[];
  contents: Array<ArticleSummary | PostRecord>;
  favorites: FavoriteRecord[];
  canCreateSpace: boolean;
}
