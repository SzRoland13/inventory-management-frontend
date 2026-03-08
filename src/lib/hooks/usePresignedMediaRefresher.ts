import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/userStore';
import { MediaService } from '@/lib/services/MediaService';
import { useCompanyStore } from '@/lib/stores/companyStore';

/**
 * Hook to silently refresh presigned media URLs (user avatar + company logo).
 * Place it in the layout so it runs globally.
 */
export function usePresignedMediaRefresher() {
  const { avatarId, avatarUrlExpiry, setUser } = useUserStore();
  const { logoId, logoUrlExpiry, setCompanyData } = useCompanyStore();

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!avatarId) return;

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

    const fetchCompanyLogo = async () => {
      if (!logoId) return;

      try {
        const res = await MediaService.getPreview(logoId);
        if (res.success && res.payload) {
          setCompanyData({
            logoId: res.payload.id,
            logoUrl: res.payload.getUrl,
            logoUrlExpiry: res.payload.expiry,
          });
        }
      } catch (err) {
        console.error('Failed to refresh company logo URL', err);
      }
    };

    const checkAndRefresh = () => {
      const now = Date.now();
      const avatarExpiryTime = avatarUrlExpiry
        ? new Date(avatarUrlExpiry).getTime()
        : null;

      const logoExpiryTime = logoUrlExpiry
        ? new Date(logoUrlExpiry).getTime()
        : null;

      if (
        !avatarUrlExpiry ||
        (avatarExpiryTime && avatarExpiryTime - now < 60_000)
      ) {
        // Refresh if no URL or expired / about to expire in < 1 min
        fetchAvatar();
      }

      if (
        logoId &&
        (!logoUrlExpiry || (logoExpiryTime && logoExpiryTime - now < 60_000))
      ) {
        fetchCompanyLogo();
      }
    };

    // Check immediately and then every 60s
    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 60_000);

    return () => clearInterval(interval);
  }, [
    avatarId,
    avatarUrlExpiry,
    logoId,
    logoUrlExpiry,
    setCompanyData,
    setUser,
  ]);
}
