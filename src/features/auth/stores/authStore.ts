import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AuthState {
  email: string | null;
  shortLifeTokenExpiry: Date | null;
  shortLifeToken: string | null;
  setAuthData: (data: Partial<AuthState>) => void;
  clearAuthData: () => void;
  getRemainingSessionSeconds: () => number;
}

export const useAuthStore = create(
  persist(
    immer<AuthState>((set, get) => ({
      email: null,
      shortLifeTokenExpiry: null,
      shortLifeToken: null,

      setAuthData: (data) => set((state) => Object.assign(state, data)),
      clearAuthData: () =>
        set(() => ({
          email: null,
          shortLifeToken: null,
          shortLifeTokenExpiry: null,
        })),
      getRemainingSessionSeconds: () => {
        const expiry = get().shortLifeTokenExpiry;
        if (!expiry) return 0;

        const expiryDate = expiry instanceof Date ? expiry : new Date(expiry);
        const now = new Date();

        const diff = expiryDate.getTime() - now.getTime();
        return diff > 0 ? Math.floor(diff / 1000) : 0;
      },
    })),
    {
      name: 'auth-storage',
    },
  ),
);
