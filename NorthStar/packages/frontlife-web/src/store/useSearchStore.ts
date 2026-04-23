import { create } from 'zustand';

interface SearchState {
  query: string;
  recentQueries: string[];
  setQuery: (query: string) => void;
  addRecentQuery: (query: string) => void;
  clearRecentQueries: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  query: '',
  recentQueries: [],
  setQuery: (query) => set({ query }),
  addRecentQuery: (query) =>
    set((state) => {
      const value = query.trim();
      if (!value) return state;
      return {
        query: value,
        recentQueries: [value, ...state.recentQueries.filter((item) => item !== value)].slice(0, 8),
      };
    }),
  clearRecentQueries: () => set({ recentQueries: [] }),
}));
