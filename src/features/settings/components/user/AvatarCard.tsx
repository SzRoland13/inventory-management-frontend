import { Button } from '@/features/shared/components/ui/button';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/features/shared/components/ui/avatar';
import { Upload } from 'lucide-react';
import { useAvatarStore } from '@/features/shared/media/avatarStore';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { toast } from 'sonner';
import CardWrapper from '@/features/shared/components/CardWrapper';
import { useMediaUploadMutation } from '@/features/shared/media/mediaQueries';
import { useUpdateUserAvatarMutation } from '@/features/users/queries/userQueries';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';

export default function AvatarCard() {
  const avatarUrl = useAvatarStore((state) => state.avatarUrl);
  const setAvatar = useAvatarStore((state) => state.setAvatar);
  const sessionQuery = useSessionQuery();

  const uploadMedia = useMediaUploadMutation();
  const updateAvatar = useUpdateUserAvatarMutation();

  const avatar = uploadMedia.data?.payload ?? null;
  const imageSrc = avatar?.getUrl ?? avatarUrl ?? undefined;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    try {
      await uploadMedia.mutateAsync(file);
    } catch (error) {
      toastApiError(t, error);
    }
  };

  const handleSaveAvatar = async () => {
    const mediaAssetId = avatar?.id;
    if (!mediaAssetId) return;

    const userId = sessionQuery.data?.payload.id;
    if (!userId) {
      toast.error(t('messagekey.error.generic'));
      return;
    }

    try {
      const response = await updateAvatar.mutateAsync({
        id: userId,
        request: { mediaAssetId },
      });

      if (avatar?.getUrl && avatar.expiry && avatar.id) {
        setAvatar({
          avatarId: avatar.id,
          avatarUrl: avatar.getUrl,
          avatarUrlExpiry: avatar.expiry,
        });
      }

      toast(t(`messagekey.${response.messageKey}`));
    } catch (error) {
      toastApiError(t, error);
    }
  };

  return (
    <CardWrapper
      title={t('pages.settings.tabs.user.profile.title')}
      description={t('pages.settings.tabs.user.profile.description')}
      cardContentExtraClass='flex flex-col items-center gap-6'
    >
      {/* Avatar Upload */}
      <div
        className='relative group cursor-pointer'
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className='w-32 h-32 border border-zinc-700'>
          {imageSrc && <AvatarImage src={imageSrc} alt='Avatar preview' />}

          {!imageSrc && (
            <AvatarFallback className='bg-zinc-800 text-zinc-400'>
              {t('pages.settings.tabs.user.profile.upload')}
            </AvatarFallback>
          )}
        </Avatar>

        <div
          className='absolute inset-0 flex items-center justify-center
                bg-black/40 opacity-0 group-hover:opacity-100
                transition rounded-full'
        >
          <Upload size={20} className='text-white' />
        </div>
      </div>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />

      <Button
        onClick={handleSaveAvatar}
        disabled={!avatar?.id}
        className='bg-zinc-500 w-72 self-center'
      >
        {t('pages.settings.tabs.user.profile.save')}
      </Button>
    </CardWrapper>
  );
}
