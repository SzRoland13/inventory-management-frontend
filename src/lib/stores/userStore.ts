import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/lib/enums/user';
import { immer } from 'zustand/middleware/immer';

interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  role: UserRole | null;
  avatarId: number | null;
  avatarUrl: string | null;
  avatarUrlExpiry: string | null;
  setUser: (data: Partial<UserState>) => void;
  clearUser: () => void;
}

export const useUserStore = create(
  persist(
    immer<UserState>((set) => ({
      id: null,
      username: null,
      email: null,
      role: null,
      avatarId: null,
      avatarUrl: null,
      avatarUrlExpiry: null,

      setUser: (data) => set((state) => Object.assign(state, data)),
      clearUser: () =>
        set(() => ({
          id: null,
          username: null,
          email: null,
          role: null,
          avatarId: null,
          avatarUrl: null,
          avatarUrlExpiry: null,
        })),
    })),
    {
      name: 'user-storage',
    },
  ),
);
