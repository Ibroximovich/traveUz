import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, UserRole, AuthState } from '../types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      selectedRole: 'TOURIST',

      setSelectedRole: (role: UserRole) =>
        set({
          selectedRole: role,
        }),

      setAuth: (user: User, tokens: AuthTokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),

      updateUser: (user: User) =>
        set((state) => ({
          ...state,
          user,
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'tripuz_auth_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
