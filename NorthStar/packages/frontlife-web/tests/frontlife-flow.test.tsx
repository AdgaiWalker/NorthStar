import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { useUIStore } from '../src/store/useUIStore';
import { useUserStore } from '../src/store/useUserStore';

const apiMock = vi.hoisted(() => ({
  getFeed: vi.fn(),
  listSpaces: vi.fn(),
  getSpace: vi.fn(),
  search: vi.fn(),
  getArticle: vi.fn(),
  getSpacePosts: vi.fn(),
  recordSearchLog: vi.fn(),
  searchAiStream: vi.fn(),
  markArticleHelpful: vi.fn(),
  markArticleChanged: vi.fn(),
  reportContent: vi.fn(),
  getPermissions: vi.fn(),
  createPost: vi.fn(),
  replyToPost: vi.fn(),
  markPostSolved: vi.fn(),
  generateArticleDraft: vi.fn(),
  createArticle: vi.fn(),
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  getProfile: vi.fn(),
  favorite: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: apiMock,
}));

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('frontlife pages', () => {
  afterEach(() => {
    cleanup();
    useUserStore.getState().logout();
    useUIStore.getState().resetNotifications();
  });

  beforeEach(() => {
    window.localStorage.removeItem('frontlife-user-storage');
    apiMock.getFeed.mockResolvedValue({
      items: [
        {
          id: 'feed-1',
          type: 'article',
          createdAt: '2026-04-22T00:00:00.000Z',
          articleId: 'campus-a1',
          spaceId: 'food',
          title: '二食堂麻辣烫实测',
          summary: '人均 15 元',
          actorName: '盘根编辑',
          helpfulCount: 34,
        },
      ],
      hasMore: false,
    });
    apiMock.listSpaces.mockResolvedValue({
      spaces: [
        {
          id: 'food',
          slug: 'food',
          title: '校园美食地图',
          description: '吃遍每一食堂',
          iconName: 'Utensils',
          category: 'food',
          articleCount: 1,
          helpfulCount: 34,
          favoriteCount: 10,
          recentActiveAt: '2026-04-22T00:00:00.000Z',
          maintainer: { id: 'u1', name: '盘根编辑' },
        },
      ],
    });
    apiMock.getSpace.mockResolvedValue({
      space: {
        id: 'food',
        slug: 'food',
        title: '校园美食地图',
        description: '吃遍每一食堂',
        iconName: 'Utensils',
        category: 'food',
        articleCount: 1,
        helpfulCount: 34,
        favoriteCount: 10,
        recentActiveAt: '2026-04-22T00:00:00.000Z',
        maintainer: { id: 'u1', name: '盘根编辑' },
      },
      articles: [
        {
          id: 'campus-a1',
          slug: 'campus-a1',
          spaceId: 'food',
          parentId: null,
          title: '二食堂麻辣烫实测',
          summary: '人均 15 元',
          helpfulCount: 34,
          changedCount: 0,
          readCount: 100,
          favoriteCount: 10,
          confirmedAt: '2026-04-22T00:00:00.000Z',
          updatedAt: '2026-04-22T00:00:00.000Z',
        },
      ],
    });
    apiMock.search.mockResolvedValue({
      articles: [
        {
          id: 'campus-a1',
          slug: 'campus-a1',
          spaceId: 'food',
          parentId: null,
          title: '二食堂麻辣烫实测',
          summary: '人均 15 元',
          helpfulCount: 34,
          changedCount: 0,
          readCount: 100,
          favoriteCount: 10,
          confirmedAt: '2026-04-22T00:00:00.000Z',
          updatedAt: '2026-04-22T00:00:00.000Z',
        },
      ],
      posts: [],
      spaces: [],
    });
    apiMock.getSpacePosts.mockResolvedValue({ posts: [] });
    apiMock.getArticle.mockResolvedValue({
      article: {
        id: 'campus-a1',
        slug: 'campus-a1',
        spaceId: 'food',
        parentId: null,
        title: '二食堂麻辣烫实测',
        summary: '人均 15 元',
        content: '# 二食堂麻辣烫实测\n\n## 价格\n\n人均 15 元。',
        helpfulCount: 34,
        changedCount: 0,
        readCount: 100,
        favoriteCount: 10,
        confirmedAt: '2026-04-22T00:00:00.000Z',
        updatedAt: '2026-04-22T00:00:00.000Z',
        author: { id: 'u1', name: '盘根编辑' },
        space: { id: 'food', title: '校园美食地图', iconName: 'Utensils' },
        changeNotes: [],
      },
      previousArticleId: null,
      nextArticleId: null,
    });
    apiMock.recordSearchLog.mockResolvedValue({ log: { id: 'log-1' } });
    apiMock.searchAiStream.mockImplementation(async (_query: string, onDelta: (delta: string) => void) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      onDelta('AI 补充回答');
    });
    apiMock.getPermissions.mockResolvedValue({
      canPost: true,
      canWrite: false,
      canCreateSpace: false,
    });
    apiMock.createPost.mockResolvedValue({
      post: {
        id: 'post-new',
        spaceId: 'food',
        content: '新发帖',
        tags: ['share'],
        author: { id: 'u1', name: '张同学' },
        helpfulCount: 0,
        replyCount: 0,
        createdAt: '刚刚',
        replies: [],
      },
    });
    apiMock.replyToPost.mockResolvedValue({
      reply: {
        id: 'reply-new',
        postId: 'post-help',
        content: '可以去图书馆一楼问问。',
        author: { id: 'u1', name: '张同学' },
        starCount: 0,
        createdAt: '刚刚',
      },
    });
    apiMock.markPostSolved.mockResolvedValue({
      post: {
        id: 'post-help',
        spaceId: 'food',
        content: '求助：打印店几点关门？',
        tags: ['help'],
        author: { id: 'u2', name: '李同学' },
        helpfulCount: 0,
        replyCount: 0,
        createdAt: '刚刚',
        replies: [],
        solved: true,
      },
    });
    apiMock.generateArticleDraft.mockResolvedValue({
      reply: '我先给你整理了一版文章草稿。发布前请确认真实时间、地点、价格和联系人。',
      directions: ['核对窗口位置', '补充价格区间', '写清更新时间'],
      draft: {
        title: '三食堂烤冷面窗口测评',
        content: '# 三食堂烤冷面窗口测评\n\n## 先说结论\n适合晚饭前快速解决一餐。',
      },
    });
    apiMock.createArticle.mockResolvedValue({
      article: {
        id: 'article-new',
        slug: 'article-new',
        spaceId: 'food',
        parentId: null,
        title: '三食堂烤冷面窗口测评',
        summary: '适合晚饭前快速解决一餐。',
        content: '# 三食堂烤冷面窗口测评\n\n## 先说结论\n适合晚饭前快速解决一餐。',
        helpfulCount: 0,
        changedCount: 0,
        readCount: 0,
        favoriteCount: 0,
        confirmedAt: '2026-04-22T00:00:00.000Z',
        updatedAt: '2026-04-22T00:00:00.000Z',
        author: { id: 'u1', name: '张同学' },
        space: { id: 'food', title: '校园美食地图', iconName: 'Utensils' },
        changeNotes: [],
      },
    });
    apiMock.getNotifications.mockResolvedValue({
      notifications: [
        {
          id: 'notification-1',
          type: 'reply',
          title: '有人回复了你的帖子',
          content: '图书馆工作日一般到晚上 10 点。',
          isRead: false,
          createdAt: '2026-04-22T00:00:00.000Z',
        },
      ],
    });
    apiMock.getProfile.mockResolvedValue({
      user: { id: 'demo-user', name: '张同学', school: '黑河学院' },
      stats: { helpedCount: 1, articleCount: 0, favoriteCount: 0 },
      spaces: [],
      contents: [],
      favorites: [],
      canCreateSpace: false,
    });
    apiMock.favorite.mockResolvedValue({ favorite: { id: 'favorite-1' } });
  });

  it('renders home feed', async () => {
    renderRoute('/');

    expect(screen.getByText('问清楚，再出门。')).toBeInTheDocument();
    expect(await screen.findByText('二食堂麻辣烫实测')).toBeInTheDocument();
  });

  it('renders search results', async () => {
    renderRoute('/search?q=食堂');

    expect(await screen.findByText(/找到/)).toBeInTheDocument();
    expect(screen.getAllByText('二食堂麻辣烫实测').length).toBeGreaterThan(0);
  });

  it('shows AI fallback when search has no local result', async () => {
    apiMock.search.mockResolvedValueOnce({
      articles: [],
      posts: [],
      spaces: [],
    });

    renderRoute('/search?q=打印店在哪');

    expect(await screen.findByText('由 AI 生成，仅供参考')).toBeInTheDocument();
    expect(await screen.findByText(/AI 补充回答/)).toBeInTheDocument();
    expect(apiMock.searchAiStream).toHaveBeenCalledWith('打印店在哪', expect.any(Function));
  });

  it('renders article and feedback controls', async () => {
    renderRoute('/article/campus-a1');

    expect((await screen.findAllByRole('heading', { name: '二食堂麻辣烫实测' })).length).toBeGreaterThan(0);
    expect(screen.getByText('有帮助')).toBeInTheDocument();
    expect(screen.getByText('有变化')).toBeInTheDocument();
  });

  it('creates a post from the space page', async () => {
    window.localStorage.setItem(
      'frontlife-user-storage',
      JSON.stringify({
        state: {
          token: 'test-token',
          userId: '1',
          userName: '张同学',
          permissions: { canPost: true, canWrite: false, canCreateSpace: false },
        },
      }),
    );
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({ canPost: true, canWrite: false, canCreateSpace: false });
    renderRoute('/space/food');

    const input = await screen.findByPlaceholderText('在这里说点什么...');
    fireEvent.change(input, { target: { value: '新发帖' } });
    fireEvent.click(screen.getByText('发布'));

    expect(apiMock.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceId: 'food',
        content: '新发帖',
      }),
    );
  });

  it('creates a post from the home composer', async () => {
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({ canPost: true, canWrite: false, canCreateSpace: false });

    renderRoute('/?write=1');

    await screen.findByRole('option', { name: '校园美食地图' });
    fireEvent.change(screen.getByPlaceholderText('分享、求助、二手、活动，都可以先写在这里。'), {
      target: { value: '首页发帖' },
    });
    fireEvent.click(screen.getByText('发布'));

    await waitFor(() => {
      expect(apiMock.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId: 'food',
          content: '首页发帖',
        }),
      );
    });
  });

  it('replies to a post and marks a help post solved', async () => {
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({ canPost: true, canWrite: false, canCreateSpace: false });
    apiMock.getSpacePosts.mockResolvedValueOnce({
      posts: [
        {
          id: 'post-help',
          spaceId: 'food',
          content: '求助：打印店几点关门？',
          tags: ['help'],
          author: { id: 'u2', name: '李同学' },
          helpfulCount: 0,
          replyCount: 0,
          createdAt: '刚刚',
          replies: [],
          solved: false,
        },
      ],
    });

    renderRoute('/space/food');

    fireEvent.click(await screen.findByText('求助：打印店几点关门？'));
    fireEvent.change(screen.getByPlaceholderText('写回复...'), {
      target: { value: '可以去图书馆一楼问问。' },
    });
    fireEvent.click(screen.getByRole('button', { name: '回复' }));

    await waitFor(() => {
      expect(apiMock.replyToPost).toHaveBeenCalledWith('post-help', '可以去图书馆一楼问问。');
    });

    fireEvent.click(screen.getAllByText('标记解决了')[0]);

    await waitFor(() => {
      expect(apiMock.markPostSolved).toHaveBeenCalledWith('post-help');
    });
  });

  it('generates an AI article draft and publishes it into the space knowledge area', async () => {
    apiMock.getPermissions.mockResolvedValueOnce({
      canPost: true,
      canWrite: true,
      canCreateSpace: false,
    });
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({ canPost: true, canWrite: true, canCreateSpace: false });

    renderRoute('/space/food');

    fireEvent.click(await screen.findByText('AI 写文章'));
    fireEvent.change(screen.getByPlaceholderText('例如：三食堂烤冷面窗口测评'), {
      target: { value: '三食堂烤冷面窗口测评' },
    });
    fireEvent.click(screen.getByText('生成草稿'));

    expect(await screen.findByText('建议方向')).toBeInTheDocument();
    expect((await screen.findAllByDisplayValue('三食堂烤冷面窗口测评')).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByDisplayValue(/适合晚饭前快速解决一餐/), {
      target: { value: '# 编辑后的窗口测评\n\n## 结论\n这是一段人工核对后的正文。' },
    });
    fireEvent.click(screen.getByText('发布文章'));

    await waitFor(() => {
      expect(apiMock.createArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId: 'food',
          title: '三食堂烤冷面窗口测评',
          content: expect.stringContaining('人工核对后的正文'),
        }),
      );
    });
    expect(await screen.findByText('文章已发布，已回到当前空间知识区。')).toBeInTheDocument();
    expect(screen.getAllByText('三食堂烤冷面窗口测评').length).toBeGreaterThan(0);
  });

  it('hides post composer when logged out', async () => {
    renderRoute('/space/food');

    expect(await screen.findByText('校园美食地图')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('在这里说点什么...')).not.toBeInTheDocument();
  });

  it('shows header write entry after login', async () => {
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({ canPost: true, canWrite: false, canCreateSpace: false });

    renderRoute('/');

    expect((await screen.findAllByText('写点什么')).length).toBeGreaterThan(0);
  });

  it('marks notification as read from profile page', async () => {
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({ canPost: true, canWrite: false, canCreateSpace: false });
    apiMock.markNotificationRead.mockResolvedValue({
      notification: {
        id: 'notification-1',
        type: 'reply',
        title: '有人回复了你的帖子',
        content: '图书馆工作日一般到晚上 10 点。',
        isRead: true,
        createdAt: '2026-04-22T00:00:00.000Z',
      },
    });

    renderRoute('/me');

    expect(await screen.findByText('有人回复了你的帖子')).toBeInTheDocument();
    fireEvent.click(screen.getByText('有人回复了你的帖子'));

    expect(apiMock.markNotificationRead).toHaveBeenCalledWith('notification-1');
  });
});
