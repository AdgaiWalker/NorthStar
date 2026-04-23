import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedPost } from '@/types';

interface SpaceState {
  bookmarks: Record<string, boolean>;
  userPosts: FeedPost[];
  toggleBookmark: (id: string) => void;
  addPost: (post: FeedPost) => void;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set) => ({
      bookmarks: {},
      userPosts: [],
      toggleBookmark: (id) =>
        set((state) => ({
          bookmarks: { ...state.bookmarks, [id]: !state.bookmarks[id] },
        })),
      addPost: (post) =>
        set((state) => ({
          userPosts: [post, ...state.userPosts],
        })),
    }),
    {
      name: 'frontlife-space-storage',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        userPosts: state.userPosts,
      }),
    },
  ),
);
