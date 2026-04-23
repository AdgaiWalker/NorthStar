import { create } from 'zustand';
import type { NotificationRecord } from '@ns/shared';

interface UIState {
  showSearch: boolean;
  showCreateMenu: boolean;
  showPostPreview: boolean;
  previewPostId: string | null;
  notifications: NotificationRecord[];
  sessionExpiredMessage: string;
  setShowSearch: (value: boolean) => void;
  setShowCreateMenu: (value: boolean) => void;
  setShowPostPreview: (value: boolean, postId?: string | null) => void;
  setNotifications: (notifications: NotificationRecord[]) => void;
  setSessionExpired: (message: string) => void;
  clearSessionExpired: () => void;
  markNotificationRead: (id: string) => void;
  resetNotifications: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  showSearch: false,
  showCreateMenu: false,
  showPostPreview: false,
  previewPostId: null,
  notifications: [],
  sessionExpiredMessage: '',
  setShowSearch: (value) => set({ showSearch: value }),
  setShowCreateMenu: (value) => set({ showCreateMenu: value }),
  setShowPostPreview: (value, postId) =>
    set({ showPostPreview: value, previewPostId: postId ?? null }),
  setNotifications: (notifications) => set({ notifications }),
  setSessionExpired: (message) => set({ sessionExpiredMessage: message }),
  clearSessionExpired: () => set({ sessionExpiredMessage: '' }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    })),
  resetNotifications: () => set({ notifications: [] }),
}));
