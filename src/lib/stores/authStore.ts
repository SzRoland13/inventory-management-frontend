import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AuthState {
  email: string | null;
  shortLifeToken: string | null;
  setAuthData: (data: Partial<AuthState>) => void;
  clearAuthData: () => void;
}

export const useAuthStore = create(
  persist(
    immer<AuthState>((set, get) => ({
      email: null,
      shortLifeToken: null,

      setAuthData: (data) => set((state) => Object.assign(state, data)),
      clearAuthData: () =>
        set(() => ({
          email: null,
          shortLifeToken: null,
        })),
    })),
    {
      name: 'user-storage',
    },
  ),
);
