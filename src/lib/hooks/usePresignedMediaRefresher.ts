import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/userStore';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useMediaPreviewQuery } from '@/lib/queries/mediaQueries';

/**
 * Hook to silently refresh presigned media URLs (user avatar + company logo).
 * Place it in the layout so it runs globally.
 */
export function usePresignedMediaRefresher() {
  const { avatarId, setUser } = useUserStore();
  const { logoId, setCompanyData } = useCompanyStore();

  const avatarQuery = useMediaPreviewQuery(avatarId ?? null);
  const logoQuery = useMediaPreviewQuery(logoId ?? null);

  useEffect(() => {
    const payload = avatarQuery.data?.payload;
    if (!payload) return;

    setUser({
      avatarId: payload.id,
      avatarUrl: payload.getUrl,
      avatarUrlExpiry: payload.expiry,
    });
  }, [avatarQuery.data, setUser]);

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
