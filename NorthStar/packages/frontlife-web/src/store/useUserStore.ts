import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IdentityUser, PermissionResponse, PlatformRole } from '@ns/shared';

export type CertStatus = 'none' | 'pending' | 'approved';

interface UserState {
  isLoggedIn: boolean;
  isCertified: boolean;
  certStatus: CertStatus;
  userId: string | null;
  userName: string | null;
  userUsername: string | null;
  userEmail: string | null;
  userRole: PlatformRole | null;
  userSite: 'cn' | 'com' | null;
  emailVerified: boolean;
  token: string | null;
  permissions: PermissionResponse;
  setLoggedIn: (value: boolean) => void;
  setCertified: (value: boolean) => void;
  applyCertification: () => void;
  setUser: (id: string | null, name: string | null) => void;
  setIdentityUser: (user: IdentityUser | null) => void;
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
      userUsername: null,
      userEmail: null,
      userRole: null,
      userSite: null,
      emailVerified: false,
      token: null,
      permissions: {
        canPost: false,
        canWrite: false,
        canCreateSpace: false,
      },
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setCertified: (value) => set({ isCertified: value, certStatus: value ? 'approved' : 'none' }),
      applyCertification: () => set({ certStatus: 'pending' }),
      setUser: (id, name) => set({ userId: id, userName: name }),
      setIdentityUser: (user) =>
        set({
          userId: user?.id ?? null,
          userName: user?.name ?? null,
          userUsername: user?.username ?? null,
          userEmail: user?.email ?? null,
          userRole: user?.role ?? null,
          userSite: user?.site ?? null,
          emailVerified: user?.emailVerified ?? false,
        }),
      setToken: (token) => set({ token, isLoggedIn: Boolean(token) }),
      setPermissions: (permissions) => set({ permissions }),
      logout: () =>
        set({
          isLoggedIn: false,
          isCertified: false,
          certStatus: 'none',
          userId: null,
          userName: null,
          userUsername: null,
          userEmail: null,
          userRole: null,
          userSite: null,
          emailVerified: false,
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
        userUsername: state.userUsername,
        userEmail: state.userEmail,
        userRole: state.userRole,
        userSite: state.userSite,
        emailVerified: state.emailVerified,
        token: state.token,
        permissions: state.permissions,
      }),
    },
  ),
);
