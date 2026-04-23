import type {
  ArticleDetail,
  ArticleDraftResponse,
  ArticleSummary,
  AuthResponse,
  CreateArticleInput,
  CreatePostInput,
  FeedResponse,
  FavoriteRecord,
  NotificationRecord,
  PermissionResponse,
  PostRecord,
  PostReplyRecord,
  ProfileResponse,
  SearchResponse,
  SpaceSummary,
} from '@ns/shared';
import { getCategoryBySlug } from '@ns/shared';
import { ARTICLES, FEED, KNOWLEDGE_BASES, POSTS, USERS } from '@/data/mock';

type MockAccount = {
  id: string;
  username: string;
  password: string;
  name: string;
  school: string;
  permissions: PermissionResponse;
  contentAuthorId: string;
};

type MockArticleState = {
  id: string;
  slug: string;
  spaceId: string;
  parentId: string | null;
  title: string;
  content: string;
  authorId: string;
  helpfulCount: number;
  changedCount: number;
  readCount: number;
  favoriteCount: number;
  confirmedAt: string | null;
  updatedAt: string;
  changeNotes: Array<{ id: string; note: string; createdAt: string }>;
};

type MockPostState = {
  id: string;
  spaceId: string;
  content: string;
  tags: string[];
  authorId: string;
  helpfulCount: number;
  replyCount: number;
  createdAt: string;
  solved: boolean;
  replies: PostReplyRecord[];
};

type MockNotificationState = NotificationRecord & {
  userId: string;
};

type MockFavoriteState = FavoriteRecord & {
  userId: string;
};

const now = Date.now();

const accounts = new Map<string, MockAccount>([
  [
    'zhang',
    {
      id: 'user-zhang',
      username: 'zhang',
      password: 'password',
      name: '张同学',
      school: '黑河学院',
      permissions: { canPost: true, canWrite: false, canCreateSpace: false },
      contentAuthorId: 'zhang',
    },
  ],
  [
    'editor',
    {
      id: 'user-editor',
      username: 'editor',
      password: 'password',
      name: '盘根编辑',
      school: '黑河学院',
      permissions: { canPost: true, canWrite: true, canCreateSpace: false },
      contentAuthorId: 'li',
    },
  ],
]);

let articleCounter = 9000;
let postCounter = 9000;
let replyCounter = 9000;
let favoriteCounter = 9000;
let notificationCounter = 9000;
let feedbackCounter = 9000;

const articleState = new Map<string, MockArticleState>(
  Object.values(ARTICLES).map((article) => [
    article.id,
    {
      id: article.id,
      slug: article.id,
      spaceId: article.kbId,
      parentId: null,
      title: article.title,
      content: article.content,
      authorId: article.authorId,
      helpfulCount: article.confirms,
      changedCount: 0,
      readCount: article.views,
      favoriteCount: article.saves,
      confirmedAt: toIso(now - 24 * 60 * 60 * 1000),
      updatedAt: toIso(now - 12 * 60 * 60 * 1000),
      changeNotes: [],
    },
  ]),
);

articleState.set('malatang-price-child', {
  id: 'malatang-price-child',
  slug: 'malatang-price-child',
  spaceId: 'food',
  parentId: 'malatang',
  title: '二食堂麻辣烫价格补充',
  content: '# 二食堂麻辣烫价格补充\n\n中份通常在 15 元左右，荤菜多加会接近 20 元。',
  authorId: 'li',
  helpfulCount: 2,
  changedCount: 0,
  readCount: 12,
  favoriteCount: 1,
  confirmedAt: toIso(now - 2 * 24 * 60 * 60 * 1000),
  updatedAt: toIso(now - 2 * 24 * 60 * 60 * 1000),
  changeNotes: [],
});

const postState = new Map<string, MockPostState>(
  POSTS.map((post) => [
    post.id,
    {
      id: post.id,
      spaceId: post.kbId,
      content: post.content,
      tags: post.tags,
      authorId: post.authorId,
      helpfulCount: post.saves,
      replyCount: post.replies.length,
      createdAt: toIso(now - (Number(post.id.replace(/\D/g, '')) || 1) * 10 * 60 * 1000),
      solved: false,
      replies: post.replies.map((reply) => ({
        id: reply.id,
        postId: post.id,
        content: reply.text,
        author: {
          id: reply.authorId,
          name: getDisplayName(reply.authorId),
        },
        starCount: reply.stars,
        createdAt: toIso(now - Math.max(1, reply.stars) * 60 * 1000),
      })),
    },
  ]),
);

const notifications: MockNotificationState[] = [
  {
    id: 'notification-1',
    userId: 'user-zhang',
    type: 'reply',
    title: '有人回复了你的帖子',
    content: '图书馆工作日一般到晚上 10 点。',
    isRead: false,
    createdAt: toIso(now - 20 * 60 * 1000),
  },
  {
    id: 'notification-2',
    userId: 'user-editor',
    type: 'feedback',
    title: '内容被确认有帮助',
    content: '二食堂麻辣烫测评又收到一次确认。',
    isRead: false,
    createdAt: toIso(now - 60 * 60 * 1000),
  },
];

const favorites: MockFavoriteState[] = [];
const searchLogs: Array<{ id: string; query: string; resultCount: number; usedAi: boolean; createdAt: string }> = [];

const staticAiFeed = {
  id: 'feed-ai-1',
  type: 'ai' as const,
  createdAt: toIso(now - 90 * 60 * 1000),
  query: '打印店在哪',
  answer: '校内打印店主要集中在图书馆一层和北门商业街，晚间优先看北门店是否营业。',
};

const SPACE_CATEGORY_MAP: Record<string, string> = {
  food: 'food',
  arrival: 'arrival',
  academic: 'admin',
  ai: 'activity',
  print: 'shopping',
  secondhand: 'secondhand',
  guitar: 'activity',
  freeboard: 'activity',
};

function toIso(value: number | Date) {
  return new Date(value).toISOString();
}

function summarize(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#>*_\-\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function getDisplayName(authorId: string) {
  if (authorId === 'editor') return '盘根编辑';
  return USERS[authorId]?.name ?? accounts.get(authorId)?.name ?? '张同学';
}

function getCurrentToken() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('frontlife-user-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

function getCurrentAccount() {
  const token = getCurrentToken();
  if (!token?.startsWith('mock-token:')) return null;
  const username = token.slice('mock-token:'.length);
  return accounts.get(username) ?? null;
}

function ensureAccount() {
  const account = getCurrentAccount();
  if (!account) {
    throw new Error('未登录');
  }
  return account;
}

function buildSpaceSummary(spaceId: string, index = 0): SpaceSummary {
  const kb = KNOWLEDGE_BASES[spaceId];
  const articles = listArticlesBySpace(spaceId);
  const maintainerName = kb.authorId === 'li' ? '盘根编辑' : getDisplayName(kb.authorId);
  const category = articles[0] ? inferCategory(spaceId) : spaceId;

  return {
    id: kb.id,
    slug: kb.id,
    title: kb.name,
    description: kb.desc,
    iconName: kb.iconName,
    category,
    articleCount: articles.length,
    helpfulCount: articles.reduce((sum, article) => sum + article.helpfulCount, 0),
    favoriteCount: kb.saves,
    recentActiveAt: toIso(now - index * 6 * 60 * 60 * 1000),
    maintainer: {
      id: kb.authorId,
      name: maintainerName,
    },
  };
}

function inferCategory(spaceId: string) {
  return SPACE_CATEGORY_MAP[spaceId] ?? getCategoryBySlug(spaceId)?.slug ?? 'activity';
}

function buildArticleSummary(article: MockArticleState): ArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    spaceId: article.spaceId,
    parentId: article.parentId,
    title: article.title,
    summary: summarize(article.content),
    helpfulCount: article.helpfulCount,
    changedCount: article.changedCount,
    readCount: article.readCount,
    favoriteCount: article.favoriteCount,
    confirmedAt: article.confirmedAt,
    updatedAt: article.updatedAt,
  };
}

function buildArticleDetail(articleId: string): ArticleDetail {
  const article = articleState.get(articleId);
  if (!article) {
    throw new Error('文章不存在');
  }

  const space = buildSpaceSummary(article.spaceId);
  return {
    ...buildArticleSummary(article),
    content: article.content,
    author: {
      id: article.authorId,
      name: getDisplayName(article.authorId),
    },
    space: {
      id: space.id,
      title: space.title,
      iconName: space.iconName,
    },
    changeNotes: article.changeNotes.map((item) => ({
      id: item.id,
      articleId,
      note: item.note,
      createdAt: item.createdAt,
    })),
  };
}

function listArticlesBySpace(spaceId: string) {
  return Array.from(articleState.values())
    .filter((article) => article.spaceId === spaceId)
    .sort((a, b) => {
      if (a.parentId === b.parentId) {
        return a.updatedAt < b.updatedAt ? 1 : -1;
      }
      if (a.parentId && !b.parentId) return 1;
      if (!a.parentId && b.parentId) return -1;
      return 0;
    })
    .map(buildArticleSummary);
}

function buildPostRecord(post: MockPostState): PostRecord {
  return {
    id: post.id,
    spaceId: post.spaceId,
    content: post.content,
    tags: [...post.tags],
    author: {
      id: post.authorId,
      name: getDisplayName(post.authorId),
    },
    helpfulCount: post.helpfulCount,
    replyCount: post.replyCount,
    createdAt: post.createdAt,
    replies: [...post.replies],
    solved: post.solved,
  };
}

function buildNotificationsForUser(userId: string) {
  return notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(({ userId: _userId, ...notification }) => notification);
}

function buildFavoritesForUser(userId: string) {
  return favorites
    .filter((favorite) => favorite.userId === userId)
    .map(({ userId: _userId, ...favorite }) => favorite);
}

function createNotification(userId: string, input: Omit<MockNotificationState, 'id' | 'userId' | 'createdAt' | 'isRead'>) {
  notifications.unshift({
    id: `notification-${notificationCounter += 1}`,
    userId,
    type: input.type,
    title: input.title,
    content: input.content,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

function createAiAnswer(query: string) {
  return `根据当前校园生活资料，和“${query}”最相关的结果不多。建议先看空间里的已确认文章，再去自由广场发帖补充实时信息。`;
}

function delay(ms = 30) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export const mockApi = {
  async listSpaces() {
    return {
      spaces: Object.keys(KNOWLEDGE_BASES).map((spaceId, index) => buildSpaceSummary(spaceId, index)),
    };
  },

  async getSpace(id: string) {
    const kb = KNOWLEDGE_BASES[id];
    if (!kb) throw new Error('空间不存在');

    return {
      space: buildSpaceSummary(id),
      articles: listArticlesBySpace(id),
    };
  },

  async getArticle(id: string) {
    const article = buildArticleDetail(id);
    const siblings = listArticlesBySpace(article.spaceId).map((item) => item.id);
    const index = siblings.indexOf(id);

    return {
      article,
      previousArticleId: index > 0 ? siblings[index - 1] : null,
      nextArticleId: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null,
    };
  },

  async createArticle(input: CreateArticleInput) {
    const account = ensureAccount();
    if (!account.permissions.canWrite) {
      throw new Error('Forbidden');
    }

    articleCounter += 1;
    const slug = `mock-article-${articleCounter}`;
    const createdAt = new Date().toISOString();
    const article: MockArticleState = {
      id: slug,
      slug,
      spaceId: input.spaceId,
      parentId: null,
      title: input.title,
      content: input.content,
      authorId: account.contentAuthorId,
      helpfulCount: 0,
      changedCount: 0,
      readCount: 0,
      favoriteCount: 0,
      confirmedAt: createdAt,
      updatedAt: createdAt,
      changeNotes: [],
    };
    articleState.set(article.id, article);
    createNotification(account.id, {
      type: 'feedback',
      title: '文章已发布',
      content: input.title,
    });

    return {
      article: buildArticleDetail(article.id),
    };
  },

  async generateArticleDraft(input: { topic: string; spaceTitle?: string }): Promise<ArticleDraftResponse> {
    return {
      reply: `我先按“${input.topic}”整理了一版可发布草稿，你可以继续改标题和细节。`,
      directions: [
        `先确认“${input.topic}”最容易过期的信息`,
        '把地点、时间、价格或联系人写成可核对条目',
        '最后补充个人实测和更新时间',
      ],
      draft: {
        title: `${input.topic}实用指南`,
        content: `# ${input.topic}实用指南\n\n## 先说结论\n这里先给出最关键的信息。\n\n## 适合谁看\n适合第一次接触这个主题的同学。\n\n## 具体建议\n1. 先确认时间和地点\n2. 再核对价格或材料\n3. 最后补充你自己的实测感受\n\n## 备注\n如有变化，请在文末补充更新时间。`,
      },
    };
  },

  async getSpacePosts(spaceId: string) {
    return {
      posts: Array.from(postState.values())
        .filter((post) => post.spaceId === spaceId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map(buildPostRecord),
    };
  },

  async createPost(input: CreatePostInput) {
    const account = ensureAccount();
    if (!account.permissions.canPost) {
      throw new Error('Forbidden');
    }

    postCounter += 1;
    const id = `post-${postCounter}`;
    const post: MockPostState = {
      id,
      spaceId: input.spaceId ?? 'freeboard',
      content: input.content,
      tags: input.tags?.length ? input.tags : ['share'],
      authorId: account.username,
      helpfulCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      solved: false,
      replies: [],
    };
    postState.set(id, post);
    createNotification(account.id, {
      type: 'reply',
      title: '帖子已发布',
      content: '你的短帖已经进入空间动态。',
    });

    return {
      post: buildPostRecord(post),
    };
  },

  async replyToPost(postId: string, content: string) {
    const account = ensureAccount();
    const post = postState.get(postId);
    if (!post) throw new Error('帖子不存在');

    replyCounter += 1;
    const reply: PostReplyRecord = {
      id: `reply-${replyCounter}`,
      postId,
      content,
      author: {
        id: account.username,
        name: account.name,
      },
      starCount: 0,
      createdAt: new Date().toISOString(),
    };

    post.replies.unshift(reply);
    post.replyCount = post.replies.length;

    const postOwner = accounts.get(post.authorId);
    if (postOwner && postOwner.id !== account.id) {
      createNotification(postOwner.id, {
        type: 'reply',
        title: '有人回复了帖子',
        content,
      });
    }

    return { reply };
  },

  async markPostSolved(postId: string) {
    const account = ensureAccount();
    const post = postState.get(postId);
    if (!post) throw new Error('帖子不存在');
    post.solved = true;
    createNotification(account.id, {
      type: 'trust',
      title: '求助帖已标记解决',
      content: '系统已记录这次有效帮助。',
    });
    return {
      post: buildPostRecord(post),
    };
  },

  async markArticleHelpful(articleId: string) {
    ensureAccount();
    const article = articleState.get(articleId);
    if (!article) throw new Error('文章不存在');
    article.helpfulCount += 1;
    article.confirmedAt = new Date().toISOString();
    return {
      articleId,
      helpfulCount: article.helpfulCount,
      confirmedAt: article.confirmedAt,
    };
  },

  async markArticleChanged(articleId: string, note: string) {
    ensureAccount();
    const article = articleState.get(articleId);
    if (!article) throw new Error('文章不存在');
    feedbackCounter += 1;
    const feedback = {
      id: `feedback-${feedbackCounter}`,
      articleId,
      note,
      createdAt: new Date().toISOString(),
    };
    article.changedCount += 1;
    article.changeNotes.unshift({ id: feedback.id, note: feedback.note, createdAt: feedback.createdAt });
    return {
      articleId,
      changedCount: article.changedCount,
      feedback,
    };
  },

  async reportContent(input: { targetType: 'article' | 'post'; targetId: string; reason: string }) {
    ensureAccount();
    return {
      report: {
        id: `report-${Date.now()}`,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        createdAt: new Date().toISOString(),
      },
    };
  },

  async getFeed(page: number, pageSize: number): Promise<FeedResponse> {
    const items = FEED.map((item, index) => {
      if (item.type === 'post') {
        const sourcePost = postState.get(item.data.id) ?? Array.from(postState.values())[0];
        if (!sourcePost) {
          return staticAiFeed;
        }
        const post = buildPostRecord(sourcePost);
        return {
          id: `feed-post-${post.id}`,
          type: 'post' as const,
          createdAt: toIso(now - (index + 1) * 30 * 60 * 1000),
          postId: post.id,
          spaceId: post.spaceId,
          content: post.content,
          actorName: post.author.name,
          helpfulCount: post.helpfulCount,
        };
      }

      if (item.type === 'article') {
        const article = articleState.get(item.data.articleId);
        if (!article) {
          return staticAiFeed;
        }
        return {
          id: `feed-article-${article.id}`,
          type: 'article' as const,
          createdAt: toIso(now - (index + 1) * 60 * 60 * 1000),
          articleId: article.id,
          spaceId: article.spaceId,
          title: article.title,
          summary: summarize(article.content),
          actorName: getDisplayName(article.authorId),
          helpfulCount: article.helpfulCount,
        };
      }

      return {
        id: `feed-change-${item.data.kbId}-${index}`,
        type: 'changed' as const,
        createdAt: toIso(now - (index + 1) * 2 * 60 * 60 * 1000),
        articleId: item.data.kbId,
        title: KNOWLEDGE_BASES[item.data.kbId]?.name ?? '空间有更新',
        note: `空间新增内容：${item.data.newArticle}`,
        actorName: getDisplayName(item.data.updatedBy),
      };
    });

    const merged = [staticAiFeed, ...items];
    const start = (page - 1) * pageSize;
    const pageItems = merged.slice(start, start + pageSize);

    return {
      items: pageItems,
      hasMore: start + pageSize < merged.length,
    };
  },

  async recordSearchLog(input: { query: string; resultCount: number; usedAi: boolean }) {
    searchLogs.push({
      id: `search-log-${searchLogs.length + 1}`,
      query: input.query,
      resultCount: input.resultCount,
      usedAi: input.usedAi,
      createdAt: new Date().toISOString(),
    });
    return { log: searchLogs[searchLogs.length - 1] };
  },

  async search(query: string): Promise<SearchResponse> {
    const keyword = normalizeQuery(query);
    const articles = Array.from(articleState.values())
      .filter((article) => `${article.title} ${article.content}`.toLowerCase().includes(keyword))
      .map(buildArticleSummary);
    const posts = Array.from(postState.values())
      .filter((post) => post.content.toLowerCase().includes(keyword))
      .map(buildPostRecord);
    const spaces = Object.keys(KNOWLEDGE_BASES)
      .map((spaceId, index) => buildSpaceSummary(spaceId, index))
      .filter((space) => `${space.title} ${space.description} ${space.maintainer.name}`.toLowerCase().includes(keyword));

    return { articles, posts, spaces };
  },

  async searchAiStream(query: string, onDelta: (delta: string) => void) {
    const answer = createAiAnswer(query);
    const chunks = answer.match(/.{1,14}/g) ?? [answer];
    for (const chunk of chunks) {
      await delay();
      onDelta(chunk);
    }
  },

  async register(input: { username: string; password: string }): Promise<AuthResponse> {
    if (accounts.has(input.username)) {
      throw new Error('username already exists');
    }

    const account: MockAccount = {
      id: `user-${input.username}`,
      username: input.username,
      password: input.password,
      name: input.username,
      school: '黑河学院',
      permissions: { canPost: true, canWrite: false, canCreateSpace: false },
      contentAuthorId: input.username,
    };
    accounts.set(input.username, account);

    return {
      token: `mock-token:${account.username}`,
      user: {
        id: account.id,
        name: account.name,
        username: account.username,
      },
    };
  },

  async login(input: { username: string; password: string }): Promise<AuthResponse> {
    const account = accounts.get(input.username);
    if (!account || account.password !== input.password) {
      throw new Error('invalid username or password');
    }

    return {
      token: `mock-token:${account.username}`,
      user: {
        id: account.id,
        name: account.name,
        username: account.username,
      },
    };
  },

  async getPermissions() {
    const account = getCurrentAccount();
    return account?.permissions ?? { canPost: false, canWrite: false, canCreateSpace: false };
  },

  async getNotifications() {
    const account = ensureAccount();
    return {
      notifications: buildNotificationsForUser(account.id),
    };
  },

  async markNotificationRead(id: string) {
    const account = ensureAccount();
    const notification = notifications.find((item) => item.id === id && item.userId === account.id);
    if (!notification) throw new Error('通知不存在');
    notification.isRead = true;
    const { userId: _userId, ...result } = notification;
    return { notification: result };
  },

  async getProfile(): Promise<ProfileResponse> {
    const account = ensureAccount();
    const authoredSpaces = Object.keys(KNOWLEDGE_BASES)
      .filter((spaceId) => KNOWLEDGE_BASES[spaceId].authorId === account.contentAuthorId)
      .map((spaceId, index) => buildSpaceSummary(spaceId, index));
    const contents = [
      ...Array.from(articleState.values())
        .filter((article) => article.authorId === account.contentAuthorId)
        .slice(0, 3)
        .map(buildArticleSummary),
      ...Array.from(postState.values())
        .filter((post) => post.authorId === account.username)
        .slice(0, 3)
        .map(buildPostRecord),
    ];
    const favoriteRows = buildFavoritesForUser(account.id);
    const helpedCount =
      Array.from(articleState.values())
        .filter((article) => article.authorId === account.contentAuthorId)
        .reduce((sum, article) => sum + article.helpfulCount + article.favoriteCount, 0) +
      Array.from(postState.values()).filter((post) => post.authorId === account.username && post.solved).length;

    return {
      user: {
        id: account.id,
        name: account.name,
        school: account.school,
      },
      stats: {
        helpedCount,
        articleCount: Array.from(articleState.values()).filter((article) => article.authorId === account.contentAuthorId).length,
        favoriteCount: favoriteRows.length,
      },
      spaces: authoredSpaces,
      contents,
      favorites: favoriteRows,
      canCreateSpace: account.permissions.canCreateSpace,
    };
  },

  async favorite(input: { targetType: 'article' | 'space'; targetId: string }) {
    const account = ensureAccount();
    const existing = favorites.find(
      (favorite) =>
        favorite.userId === account.id &&
        favorite.targetType === input.targetType &&
        favorite.targetId === input.targetId,
    );
    if (existing) {
      const { userId: _userId, ...favorite } = existing;
      return { favorite };
    }

    favoriteCounter += 1;
    const targetTitle =
      input.targetType === 'article'
        ? articleState.get(input.targetId)?.title ?? input.targetId
        : KNOWLEDGE_BASES[input.targetId]?.name ?? input.targetId;
    const favorite: MockFavoriteState = {
      id: `favorite-${favoriteCounter}`,
      userId: account.id,
      targetType: input.targetType,
      targetId: input.targetId,
      title: targetTitle,
      createdAt: new Date().toISOString(),
    };
    favorites.push(favorite);

    if (input.targetType === 'article') {
      const article = articleState.get(input.targetId);
      if (article) article.favoriteCount += 1;
    }

    const { userId: _userId, ...result } = favorite;
    return { favorite: result };
  },
};
