import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/userStore';
import { MediaService } from '@/lib/services/MediaService';

/**
 * Hook to silently refresh avatar URLs in the background.
 * Place it in your layout so it runs everywhere.
 */
export function useAvatarRefresher() {
  const { avatarId, avatarUrlExpiry, setUser } = useUserStore();

  useEffect(() => {
    if (!avatarId) return;

    const fetchAvatar = async () => {
      try {
        const res = await MediaService.getPreview(avatarId);
        if (res.success && res.payload) {
          setUser({
            avatarId: res.payload.id,
            avatarUrl: res.payload.getUrl,
            avatarUrlExpiry: res.payload.expiry,
          });
        }
      } catch (err) {
        console.error('Failed to refresh avatar URL', err);
      }
    };

    const checkAndRefresh = () => {
      const now = Date.now();
      // Refresh if no URL or expired / about to expire in < 1 min
      if (!avatarUrlExpiry || avatarUrlExpiry - now < 60_000) {
        fetchAvatar();
      }
    };

    // Check immediately and then every 60s
    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 60_000);

    return () => clearInterval(interval);
  }, [avatarId, avatarUrlExpiry, setUser]);
}
