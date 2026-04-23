import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';

export const SESSION_EXPIRED_REASON = 'session-expired';
export const SESSION_EXPIRED_MESSAGE = '登录状态已失效，请重新登录。';

type AuthIntent = 'read' | 'write';

const SESSION_REASON_STORAGE_KEY = 'frontlife-auth-reason';

export const authSessionActions = {
  redirectToLogin(path: string) {
    if (typeof window === 'undefined') return;
    window.location.assign(path);
  },
};

export function handleExpiredSession(intent: AuthIntent) {
  useUserStore.getState().logout();
  useUIStore.getState().resetNotifications();
  useUIStore.getState().setSessionExpired(SESSION_EXPIRED_MESSAGE);

  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(SESSION_REASON_STORAGE_KEY, SESSION_EXPIRED_REASON);

  if (intent === 'write' && window.location.pathname !== '/login') {
    authSessionActions.redirectToLogin(`/login?reason=${SESSION_EXPIRED_REASON}`);
  }
}

export function consumeSessionReason() {
  if (typeof window === 'undefined') return '';

  const value = window.sessionStorage.getItem(SESSION_REASON_STORAGE_KEY) ?? '';
  if (value) {
    window.sessionStorage.removeItem(SESSION_REASON_STORAGE_KEY);
  }
  return value;
}
