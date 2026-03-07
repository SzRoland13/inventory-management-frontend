import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/lib/utils/enums/user';
import { immer } from 'zustand/middleware/immer';

interface UserState {
  username: string | null;
  email: string | null;
  role: UserRole | null;
  setUser: (data: Partial<UserState>) => void;
  clearUser: () => void;
}

export const useUserStore = create(
  persist(
    immer<UserState>((set) => ({
      username: null,
      email: null,
      role: null,

      setUser: (data) => set((state) => Object.assign(state, data)),
      clearUser: () =>
        set(() => ({
          username: null,
          email: null,
          role: [],
        })),
    })),
    {
      name: 'user-storage',
    },
  ),
);
