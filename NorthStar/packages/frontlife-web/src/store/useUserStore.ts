import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PermissionResponse } from '@ns/shared';

export type CertStatus = 'none' | 'pending' | 'approved';

interface UserState {
  isLoggedIn: boolean;
  isCertified: boolean;
  certStatus: CertStatus;
  userId: string | null;
  userName: string | null;
  token: string | null;
  permissions: PermissionResponse;
  setLoggedIn: (value: boolean) => void;
  setCertified: (value: boolean) => void;
  applyCertification: () => void;
  setUser: (id: string | null, name: string | null) => void;
  setToken: (token: string | null) => void;
  setPermissions: (permissions: PermissionResponse) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      isCertified: false,
      certStatus: 'none',
      userId: null,
      userName: null,
      token: null,
      permissions: {
        canPost: false,
        canWrite: false,
        canCreateSpace: false,
      },
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setCertified: (value) =>
        set({ isCertified: value, certStatus: value ? 'approved' : 'none' }),
      applyCertification: () => set({ certStatus: 'pending' }),
      setUser: (id, name) => set({ userId: id, userName: name }),
      setToken: (token) => set({ token, isLoggedIn: Boolean(token) }),
      setPermissions: (permissions) => set({ permissions }),
      logout: () =>
        set({
          isLoggedIn: false,
          isCertified: false,
          certStatus: 'none',
          userId: null,
          userName: null,
          token: null,
          permissions: {
            canPost: false,
            canWrite: false,
            canCreateSpace: false,
          },
        }),
    }),
    {
      name: 'frontlife-user-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        isCertified: state.isCertified,
        certStatus: state.certStatus,
        userId: state.userId,
        userName: state.userName,
        token: state.token,
        permissions: state.permissions,
      }),
    },
  ),
);
