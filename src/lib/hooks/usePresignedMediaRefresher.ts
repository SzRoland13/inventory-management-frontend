import { useEffect } from 'react';
import { useAvatarStore } from '@/lib/stores/avatarStore';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useMediaPreviewQuery } from '@/lib/queries/mediaQueries';

/**
 * Hook to silently refresh presigned media URLs (user avatar + company logo).
 * Place it in the layout so it runs globally.
 */
export function usePresignedMediaRefresher() {
  const { avatarId, setAvatar } = useAvatarStore();
  const { logoId, setCompanyData } = useCompanyStore();

  const avatarQuery = useMediaPreviewQuery(avatarId ?? null);
  const logoQuery = useMediaPreviewQuery(logoId ?? null);

  useEffect(() => {
    const payload = avatarQuery.data?.payload;
    if (!payload) return;

    setAvatar({
      avatarId: payload.id,
      avatarUrl: payload.getUrl,
      avatarUrlExpiry: payload.expiry,
    });
  }, [avatarQuery.data, setAvatar]);

  useEffect(() => {
    const payload = logoQuery.data?.payload;
    if (!payload) return;

    setCompanyData({
      logoId: payload.id,
      logoUrl: payload.getUrl,
      logoUrlExpiry: payload.expiry,
    });
  }, [logoQuery.data, setCompanyData]);
}
