import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { MediaService } from '@/lib/services/MediaService';
import { ObjectStorageService } from '@/lib/services/ObjectStorageService';
import { UserService } from '@/lib/services/UserService';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { MediaPreviewResponse } from '@/lib/services/dtos/mediaDtos';
import CardWrapper from '@/components/common/CardWrapper';

export default function AvatarCard() {
  const [avatar, setAvatar] = useState<MediaPreviewResponse | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<number | null>(null);
  const avatarUrl = useUserStore((state) => state.avatarUrl);
  const imageSrc = avatar?.getUrl ?? avatarUrl ?? undefined;
  const setUser = useUserStore((state) => state.setUser);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    const initResp = await MediaService.initializeUpload({
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    setMediaAssetId(initResp.payload.id);

    await ObjectStorageService.putImage({
      url: initResp.payload.putUrl,
      file,
    });

    const previewResp = await MediaService.getPreview(initResp.payload.id);
    setAvatar(previewResp.payload);
  };

  const handleSaveAvatar = async () => {
    if (!mediaAssetId) return;

    const userId = useUserStore.getState().id;
    if (!userId) return;

    const response = await UserService.uploadUserAvatar(userId, {
      mediaAssetId,
    });

    if (avatar?.getUrl && avatar.expiry && avatar.id) {
      setUser({
        avatarId: avatar.id,
        avatarUrl: avatar?.getUrl,
        avatarUrlExpiry: avatar?.expiry,
      });
    }

    toast(t(`messageKey.${response.messageKey}`));
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
        disabled={!mediaAssetId}
        className='bg-zinc-500'
      >
        {t('pages.settings.tabs.user.profile.save')}
      </Button>
    </CardWrapper>
  );
}
