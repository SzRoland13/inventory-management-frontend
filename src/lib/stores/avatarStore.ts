import { create } from 'zustand';

interface AvatarState {
  avatarId: number | null;
  avatarUrl: string | null;
  avatarUrlExpiry: string | null;
  setAvatar: (data: Partial<Omit<AvatarState, 'setAvatar' | 'clearAvatar'>>) => void;
  clearAvatar: () => void;
}

// Deliberately NOT persisted: avatars aren't a privilege-escalation vector,
// but this store must not become another place identity data lives outside
// the server-verified query cache.
export const useAvatarStore = create<AvatarState>((set) => ({
  avatarId: null,
  avatarUrl: null,
  avatarUrlExpiry: null,
  setAvatar: (data) => set(data),
  clearAvatar: () => set({ avatarId: null, avatarUrl: null, avatarUrlExpiry: null }),
}));
