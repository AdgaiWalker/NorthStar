import type {
  ArticleDetail,
  ArticleDraftResponse,
  ArticleSummary,
  AuthResponse,
  CreateArticleInput,
  CreatePostInput,
  FeedResponse,
  NotificationRecord,
  PermissionResponse,
  PostRecord,
  PostReplyRecord,
  ProfileResponse,
  SearchResponse,
  SpaceSummary,
} from '@ns/shared';
import { mockApi } from './mockApi';
import { handleExpiredSession, SESSION_EXPIRED_MESSAGE } from './authSession';

export type {
  ArticleDetail,
  ArticleDraftResponse,
  ArticleSummary,
  AuthResponse,
  CreateArticleInput,
  CreatePostInput,
  FeedResponse,
  NotificationRecord,
  PermissionResponse,
  PostRecord,
  PostReplyRecord,
  ProfileResponse,
  SearchResponse,
  SpaceSummary,
} from '@ns/shared';

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & {
  authIntent?: 'read' | 'write';
};

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

function toReadableApiMessage(message: string, status?: number) {
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 403) return '当前账号没有权限执行此操作。';
  if (status && status >= 500) return '服务暂时不可用，请确认后端服务已启动或稍后重试。';
  if (message === 'invalid username or password') return '用户名或密码不正确。';
  if (message === 'username already exists') return '用户名已存在，请换一个用户名。';
  if (message === '用户名、邮箱或密码不正确') return '用户名、邮箱或密码不正确。';
  if (message === '用户名或邮箱已被使用') return '用户名或邮箱已被使用，请更换后重试。';
  if (message === 'Forbidden') return '当前账号没有权限执行此操作。';
  if (message === 'Failed to fetch' || message === 'NetworkError when attempting to fetch resource.') {
    return '网络连接失败，请确认后端服务已启动或稍后重试。';
  }
  return message || '请求失败，请稍后重试。';
}

function getPersistedToken() {
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

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const token = getPersistedToken();
  const { authIntent, ...requestInit } = init ?? {};
  let response: Response;

  try {
    response = await fetch(`${baseURL}${path}`, {
      ...requestInit,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...requestInit.headers,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    throw new ApiError(toReadableApiMessage(message), 0);
  }

  const payload = (await response.json().catch(() => null)) as T | { error?: string } | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? payload.error
        : `请求失败 (${response.status})`;
    if (response.status === 401) {
      handleExpiredSession(authIntent ?? 'read');
    }
    throw new ApiError(toReadableApiMessage(message, response.status), response.status);
  }

  return payload as T;
}

export const api = {
  listSpaces() {
    if (useMock) return mockApi.listSpaces();
    return request<{ spaces: SpaceSummary[] }>('/api/spaces');
  },

  getSpace(id: string) {
    if (useMock) return mockApi.getSpace(id);
    return request<{ space: SpaceSummary; articles: ArticleSummary[] }>(`/api/spaces/${id}`);
  },

  getArticle(id: string) {
    if (useMock) return mockApi.getArticle(id);
    return request<{
      article: ArticleDetail;
      previousArticleId: string | null;
      nextArticleId: string | null;
    }>(`/api/articles/${id}`);
  },

  createArticle(input: CreateArticleInput) {
    if (useMock) return mockApi.createArticle(input);
    return request<{ article: ArticleDetail }>('/api/articles', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  generateArticleDraft(input: { topic: string; spaceTitle?: string }) {
    if (useMock) return mockApi.generateArticleDraft(input);
    return request<ArticleDraftResponse>('/api/ai/write', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  getSpacePosts(spaceId: string) {
    if (useMock) return mockApi.getSpacePosts(spaceId);
    return request<{ posts: PostRecord[] }>(`/api/spaces/${spaceId}/posts`);
  },

  createPost(input: CreatePostInput) {
    if (useMock) return mockApi.createPost(input);
    return request<{ post: PostRecord }>('/api/posts', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  replyToPost(postId: string, content: string) {
    if (useMock) return mockApi.replyToPost(postId, content);
    return request<{ reply: PostReplyRecord }>(`/api/posts/${postId}/replies`, {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({ content }),
    });
  },

  markPostSolved(postId: string) {
    if (useMock) return mockApi.markPostSolved(postId);
    return request<{ post: PostRecord }>(`/api/posts/${postId}/solve`, {
      method: 'POST',
      authIntent: 'write',
    });
  },

  markArticleHelpful(articleId: string) {
    if (useMock) return mockApi.markArticleHelpful(articleId);
    return request<{ articleId: string; helpfulCount: number; confirmedAt: string }>(
      `/api/articles/${articleId}/helpful`,
      { method: 'POST', authIntent: 'write' },
    );
  },

  markArticleChanged(articleId: string, note: string) {
    if (useMock) return mockApi.markArticleChanged(articleId, note);
    return request<{
      articleId: string;
      changedCount: number;
      feedback: { id: string; articleId: string; note: string; createdAt: string };
    }>(`/api/articles/${articleId}/changed`, {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({ note }),
    });
  },

  reportContent(input: { targetType: 'article' | 'post'; targetId: string; reason: string }) {
    if (useMock) return mockApi.reportContent(input);
    return request<{
      report: {
        id: string;
        targetType: 'article' | 'post';
        targetId: string;
        reason: string;
        createdAt: string;
      };
    }>('/api/reports', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  getFeed(page: number, pageSize: number) {
    if (useMock) return mockApi.getFeed(page, pageSize);
    return request<FeedResponse>(`/api/feed?page=${page}&pageSize=${pageSize}`);
  },

  recordSearchLog(input: { query: string; resultCount: number; usedAi: boolean }) {
    if (useMock) return mockApi.recordSearchLog(input);
    return request('/api/search/logs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  search(query: string) {
    if (useMock) return mockApi.search(query);
    return request<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
  },

  async searchAiStream(query: string, onDelta: (delta: string) => void) {
    if (useMock) {
      return mockApi.searchAiStream(query, onDelta);
    }

    let response: Response;

    try {
      response = await fetch(`${baseURL}/api/ai/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getPersistedToken() ? { Authorization: `Bearer ${getPersistedToken()}` } : {}),
        },
        body: JSON.stringify({ query }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      throw new ApiError(toReadableApiMessage(message), 0);
    }

    if (!response.ok || !response.body) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 401) {
        handleExpiredSession('read');
      }
      throw new ApiError(toReadableApiMessage(payload?.error ?? 'AI 回答生成失败', response.status), response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const line = event.replace(/^data:\s*/, '');
        if (line === '[DONE]') return;
        const payload = JSON.parse(line) as { delta?: string };
        if (payload.delta) {
          onDelta(payload.delta);
        }
      }
    }
  },

  register(input: { username: string; email: string; password: string }) {
    if (useMock) return mockApi.register(input);
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: { account: string; password: string }) {
    if (useMock) return mockApi.login(input);
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getPermissions() {
    if (useMock) return mockApi.getPermissions();
    return request<PermissionResponse>('/api/me/permissions');
  },

  getNotifications() {
    if (useMock) return mockApi.getNotifications();
    return request<{ notifications: NotificationRecord[] }>('/api/notifications');
  },

  markNotificationRead(id: string) {
    if (useMock) return mockApi.markNotificationRead(id);
    return request<{ notification: NotificationRecord }>(`/api/notifications/${id}/read`, {
      method: 'POST',
      authIntent: 'write',
    });
  },

  getProfile() {
    if (useMock) return mockApi.getProfile();
    return request<ProfileResponse>('/api/me/profile');
  },

  favorite(input: { targetType: 'article' | 'space'; targetId: string }) {
    if (useMock) return mockApi.favorite(input);
    return request<{
      favorite: {
        id: string;
        targetType: 'article' | 'space';
        targetId: string;
        title: string;
        createdAt: string;
      };
    }>('/api/favorites', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },
};
