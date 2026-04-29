import type {
  Article,
  ApplicationRequestInput,
  ApplicationRequestRecord,
  CompassCapabilityResponse,
  CompassFavoriteRecord,
  CompassNewsRecord,
  ContentItem,
  CreateSolutionRequest,
  ExportFormat,
  GitHubOAuthStartResponse,
  GitHubOAuthStatusResponse,
  IdentityMeResponse,
  IdentitySession,
  LoginRequest,
  PaymentOrderRecord,
  QuotaLedgerRecord,
  QuotaRecord,
  RegisterRequest,
  SolutionFeedbackRequest,
  SolutionRecord,
  Tool,
  Topic,
} from '@ns/shared';
import { STORAGE_KEYS, storageRemove } from '@/utils/storage';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const COMPASS_SITE = 'com';

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getStoredToken() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.identityToken);
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.identityToken);
    return null;
  }
}

function readableMessage(message: string, status?: number) {
  if (status === 401) return '登录状态已失效，请重新登录。';
  if (status === 403) return '当前账号暂未开放该能力。';
  if (status && status >= 500) return '服务暂时不可用，请确认后端服务已启动或稍后重试。';
  if (message === '用户名、邮箱或密码不正确') return message;
  if (message === '用户名或邮箱已被使用') return message;
  if (message === 'Failed to fetch') return '网络连接失败，请确认后端服务已启动或稍后重试。';
  return message || '请求失败，请稍后重试。';
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }
  return null;
}

async function request<T>(path: string, init?: Parameters<typeof fetch>[1]): Promise<T> {
  let response: Response;
  const token = getStoredToken();

  try {
    response = await fetch(`${baseURL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-pangen-site': COMPASS_SITE,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiError(readableMessage(error instanceof Error ? error.message : ''), 0);
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    if (response.status === 401) {
      storageRemove(STORAGE_KEYS.identityToken);
      storageRemove(STORAGE_KEYS.identityUser);
    }
    throw new ApiError(readableMessage(extractErrorMessage(payload) ?? '请求失败', response.status), response.status);
  }

  return payload as T;
}

function unwrap<T>(payload: ApiEnvelope<T>) {
  if (!payload.ok) {
    throw new ApiError(readableMessage(payload.error?.message ?? '请求失败'), 200);
  }
  return payload.data;
}

export const identityApi = {
  login(input: Omit<LoginRequest, 'site'>) {
    return request<ApiEnvelope<IdentitySession>>('/api/identity/login', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: COMPASS_SITE }),
    }).then(unwrap);
  },

  register(input: Omit<RegisterRequest, 'site'>) {
    return request<ApiEnvelope<IdentitySession>>('/api/identity/register', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: COMPASS_SITE }),
    }).then(unwrap);
  },

  submitApplication(input: Omit<ApplicationRequestInput, 'site'>) {
    return request<ApiEnvelope<ApplicationRequestRecord>>('/api/identity/applications', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: COMPASS_SITE }),
    }).then(unwrap);
  },

  me() {
    return request<ApiEnvelope<IdentityMeResponse>>('/api/identity/me').then(unwrap);
  },

  getGitHubOAuthStatus() {
    return request<ApiEnvelope<GitHubOAuthStatusResponse>>('/api/identity/oauth/github/status').then(unwrap);
  },

  startGitHubOAuth() {
    return request<ApiEnvelope<GitHubOAuthStartResponse>>('/api/identity/oauth/github/start', {
      method: 'POST',
      body: JSON.stringify({ site: COMPASS_SITE }),
    }).then(unwrap);
  },
};

export const compassApi = {
  listTools() {
    return request<ApiEnvelope<{ items: Tool[] }>>('/api/compass/tools').then(unwrap);
  },

  getTool(id: string) {
    return request<ApiEnvelope<Tool>>(`/api/compass/tools/${encodeURIComponent(id)}`).then(unwrap);
  },

  listTopics() {
    return request<ApiEnvelope<{ items: Topic[] }>>('/api/compass/topics').then(unwrap);
  },

  listArticles() {
    return request<ApiEnvelope<{ items: Article[] }>>('/api/compass/articles').then(unwrap);
  },

  getArticle(id: string) {
    return request<ApiEnvelope<Article>>(`/api/compass/articles/${encodeURIComponent(id)}`).then(unwrap);
  },

  listNews() {
    return request<ApiEnvelope<{ items: CompassNewsRecord[] }>>('/api/compass/news').then(unwrap);
  },

  search(query: string) {
    return request<ApiEnvelope<{
      tools: any[];
      topics: any[];
      articles: any[];
      news: any[];
    }>>(`/api/compass/search?q=${encodeURIComponent(query)}`).then(unwrap);
  },

  listFavorites() {
    return request<ApiEnvelope<{ items: CompassFavoriteRecord[] }>>('/api/compass/favorites').then(unwrap);
  },

  addFavorite(input: Pick<CompassFavoriteRecord, 'targetType' | 'targetId'>) {
    return request<ApiEnvelope<CompassFavoriteRecord>>('/api/compass/favorites', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(unwrap);
  },

  removeFavorite(input: Pick<CompassFavoriteRecord, 'targetType' | 'targetId'>) {
    return request<ApiEnvelope<{ deleted: boolean }>>('/api/compass/favorites', {
      method: 'DELETE',
      body: JSON.stringify(input),
    }).then(unwrap);
  },

  listSolutions() {
    return request<ApiEnvelope<{ items: SolutionRecord[] }>>('/api/compass/solutions').then(unwrap);
  },

  getSolution(id: string) {
    return request<ApiEnvelope<SolutionRecord>>(`/api/compass/solutions/${encodeURIComponent(id)}`).then(unwrap);
  },

  createSolution(input: CreateSolutionRequest) {
    return request<ApiEnvelope<SolutionRecord>>('/api/compass/solutions', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(unwrap);
  },

  deleteSolution(id: string) {
    return request<ApiEnvelope<{ deleted: boolean }>>(`/api/compass/solutions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).then(unwrap);
  },

  submitSolutionFeedback(id: string, input: SolutionFeedbackRequest) {
    return request<ApiEnvelope<{ feedback: unknown }>>(`/api/compass/solutions/${encodeURIComponent(id)}/feedback`, {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(unwrap);
  },

  async exportSolution(id: string, format: ExportFormat) {
    const token = getStoredToken();
    const response = await fetch(
      `${baseURL}/api/compass/solutions/${encodeURIComponent(id)}/export?format=${encodeURIComponent(format)}`,
      {
        headers: {
          'x-pangen-site': COMPASS_SITE,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new ApiError(readableMessage(extractErrorMessage(payload) ?? '导出失败', response.status), response.status);
    }

    return response.text();
  },
};

export const platformApi = {
  getCompassCapabilities() {
    return request<ApiEnvelope<CompassCapabilityResponse>>('/api/platform/capabilities?site=compass').then(unwrap);
  },
};

export const billingApi = {
  getQuota() {
    return request<ApiEnvelope<{ quota: QuotaRecord; ledger: QuotaLedgerRecord[] }>>('/api/billing/quota').then(unwrap);
  },

  listOrders() {
    return request<ApiEnvelope<{ items: PaymentOrderRecord[] }>>('/api/billing/orders').then(unwrap);
  },

  createManualOrder(input: { credits: number; amountCents: number; currency?: string }) {
    return request<ApiEnvelope<PaymentOrderRecord>>('/api/billing/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(unwrap);
  },
};

export const complianceApi = {
  getLegalDocument(type: 'terms' | 'privacy') {
    return request<ApiEnvelope<{ title: string; content: string; version: string; publishedAt: string }>>(
      `/api/compliance/legal-documents?type=${type}`
    ).then(unwrap);
  },

  requestPasswordReset(account: string) {
    return request<ApiEnvelope<{ success: boolean }>>('/api/identity/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ account }),
    }).then(unwrap);
  },

  confirmPasswordReset(token: string, newPassword: string) {
    return request<ApiEnvelope<{ success: boolean }>>('/api/identity/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }).then(unwrap);
  },
};

export const contentApi = {
  listContent() {
    return request<ApiEnvelope<{ items: ContentItem[] }>>('/api/compass/content').then(unwrap);
  },

  createContent(input: { title: string; summary: string; domain: string; markdown: string }) {
    return request<ApiEnvelope<ContentItem>>('/api/compass/content', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(unwrap);
  },

  getContent(id: string) {
    return request<ApiEnvelope<ContentItem>>(`/api/compass/content/${encodeURIComponent(id)}`).then(unwrap);
  },

  updateContent(id: string, input: { title?: string; summary?: string; domain?: string; markdown?: string }) {
    return request<ApiEnvelope<ContentItem>>(`/api/compass/content/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }).then(unwrap);
  },

  submitContentForReview(id: string) {
    return request<ApiEnvelope<{ submitted: boolean }>>(`/api/compass/content/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
    }).then(unwrap);
  },
};
