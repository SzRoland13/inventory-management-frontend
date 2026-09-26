import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AvatarState {
  avatarId: number | null;
  avatarUrl: string | null;
  avatarUrlExpiry: string | null;
  setAvatar: (data: Partial<Omit<AvatarState, 'setAvatar' | 'clearAvatar'>>) => void;
  clearAvatar: () => void;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set) => ({
      avatarId: null,
      avatarUrl: null,
      avatarUrlExpiry: null,
      setAvatar: (data) => set(data),
      clearAvatar: () => set({ avatarId: null, avatarUrl: null, avatarUrlExpiry: null }),
    }),
    {
      name: 'avatar-store',
    },
  ),
);
