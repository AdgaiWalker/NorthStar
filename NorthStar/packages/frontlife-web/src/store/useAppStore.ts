import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedPost } from '@/types';

export type CertStatus = 'none' | 'pending' | 'approved';

interface AppState {
  // Auth
  isLoggedIn: boolean;
  isCertified: boolean;
  certStatus: CertStatus;
  userId: string | null;
  userName: string | null;

  // UI
  showSearch: boolean;
  showCreateMenu: boolean;
  showPostPreview: boolean;
  previewPostId: string | null;

  // Data
  bookmarks: Record<string, boolean>;
  userPosts: FeedPost[];

  // Actions
  setLoggedIn: (v: boolean) => void;
  setCertified: (v: boolean) => void;
  applyCertification: () => void;
  setUser: (id: string | null, name: string | null) => void;
  toggleBookmark: (id: string) => void;
  setShowSearch: (v: boolean) => void;
  setShowCreateMenu: (v: boolean) => void;
  setShowPostPreview: (v: boolean, postId?: string | null) => void;
  addPost: (post: FeedPost) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isLoggedIn: true,
      isCertified: false,
      certStatus: 'none',
      userId: 'zhang',
      userName: '张同学',
      showSearch: false,
      showCreateMenu: false,
      showPostPreview: false,
      previewPostId: null,
      bookmarks: {},
      userPosts: [],

      setLoggedIn: (v) => set({ isLoggedIn: v }),
      setCertified: (v) => set({ isCertified: v, certStatus: v ? 'approved' : 'none' }),
      applyCertification: () => set({ certStatus: 'pending' }),
      setUser: (id, name) => set({ userId: id, userName: name }),
      toggleBookmark: (id) =>
        set((state) => ({
          bookmarks: { ...state.bookmarks, [id]: !state.bookmarks[id] },
        })),
      setShowSearch: (v) => set({ showSearch: v }),
      setShowCreateMenu: (v) => set({ showCreateMenu: v }),
      setShowPostPreview: (v, postId) => set({ showPostPreview: v, previewPostId: postId ?? null }),
      addPost: (post) =>
        set((state) => ({
          userPosts: [post, ...state.userPosts],
        })),
    }),
    {
      name: 'frontlife-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        isCertified: state.isCertified,
        certStatus: state.certStatus,
        userId: state.userId,
        userName: state.userName,
        bookmarks: state.bookmarks,
        userPosts: state.userPosts,
      }),
    }
  )
);
