import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USER_ROLE } from '../utils/enums';
import { immer } from 'zustand/middleware/immer';

interface UserState {
  username: string | null;
  email: string | null;
  role: USER_ROLE | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (data: Partial<UserState>) => void;
  clearUser: () => void;
}

export const useUserStore = create(
  persist(
    immer<UserState>((set, get) => ({
      username: null,
      email: null,
      role: null,
      accessToken: null,
      refreshToken: null,

      setUser: (data) => set((state) => Object.assign(state, data)),
      clearUser: () =>
        set(() => ({
          username: null,
          roles: [],
          accessToken: null,
          refreshToken: null,
        })),
    })),
    {
      name: 'user-storage',
    },
  ),
);

export const getAccessToken = () => useUserStore.getState().accessToken;
export const getRefreshToken = () => useUserStore.getState().refreshToken;
