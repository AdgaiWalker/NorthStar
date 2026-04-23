import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authSession from '../src/services/authSession';
import { useUIStore } from '../src/store/useUIStore';
import { useUserStore } from '../src/store/useUserStore';

describe('auth session', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    useUserStore.getState().setToken('test-token');
    useUserStore.getState().setUser('1', '张同学');
    useUserStore.getState().setPermissions({
      canPost: true,
      canWrite: false,
      canCreateSpace: false,
    });
    useUIStore.getState().setNotifications([
      {
        id: 'notification-1',
        type: 'reply',
        title: '有人回复了你的帖子',
        content: '测试通知',
        isRead: false,
        createdAt: '2026-04-22T00:00:00.000Z',
      },
    ]);
    useUIStore.getState().clearSessionExpired();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useUserStore.getState().logout();
    useUIStore.getState().resetNotifications();
    useUIStore.getState().clearSessionExpired();
  });

  it('clears auth state and sets a banner for read actions', () => {
    authSession.handleExpiredSession('read');

    expect(useUserStore.getState().token).toBeNull();
    expect(useUIStore.getState().notifications).toEqual([]);
    expect(useUIStore.getState().sessionExpiredMessage).toBe(authSession.SESSION_EXPIRED_MESSAGE);
    expect(window.sessionStorage.getItem('frontlife-auth-reason')).toBe(authSession.SESSION_EXPIRED_REASON);
  });

  it('redirects to login for write actions', () => {
    const redirectSpy = vi.spyOn(authSession.authSessionActions, 'redirectToLogin').mockImplementation(() => undefined);

    authSession.handleExpiredSession('write');

    expect(redirectSpy).toHaveBeenCalledWith(`/login?reason=${authSession.SESSION_EXPIRED_REASON}`);
  });
});
