'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { MediaService } from '@/lib/services/MediaService';
import { ObjectStorageService } from '@/lib/services/ObjectStorageService';
import { UserService } from '@/lib/services/UserService';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function UserTab() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    const initResp = await MediaService.initializeUpload({
      filename: file.name,
      mimeType: file.type,
    });

    setMediaAssetId(initResp.payload.id);

    await ObjectStorageService.putImage({
      url: initResp.payload.putUrl,
      file,
    });

    const previewResp = await MediaService.getPreview(initResp.payload.id);
    setPreviewUrl(previewResp.payload.getUrl);
  };

  const handleSaveAvatar = async () => {
    if (!mediaAssetId) return;

    const userId = useUserStore.getState().id;
    if (!userId) return;

    const response = await UserService.uploadUserAvatar(userId, {
      mediaAssetId,
    });

    toast(t(`messageKey.${response.messageKey}`));
  };

  return (
    <Card className='w-full h-full bg-zinc-800 border-zinc-700 shadow-xl'>
      <CardHeader className='flex flex-col gap-2'>
        <CardTitle className='text-xl font-semibold text-zinc-100'>
          {t('pages.settings.tabs.user.profile.title')}
        </CardTitle>
        <CardDescription className='text-zinc-400'>
          {t('pages.settings.tabs.user.profile.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-col items-start'>
        <div className='flex flex-col items-center gap-6'>
          {/* Avatar Upload */}
          <div
            className='relative group cursor-pointer'
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className='w-32 h-32 border border-zinc-700'>
              {previewUrl && (
                <AvatarImage src={previewUrl} alt='Avatar preview' />
              )}

              <AvatarFallback className='bg-zinc-800 text-zinc-400'>
                {t('pages.settings.tabs.user.profile.upload')}
              </AvatarFallback>
            </Avatar>

            <div
              className='absolute inset-0 flex items-center justify-center
                       bg-black/40 opacity-0 group-hover:opacity-100
                       transition rounded-full'
            >
              <Upload size={20} className='text-white' />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />

          {/* Save button */}
          <Button
            onClick={handleSaveAvatar}
            disabled={!mediaAssetId}
            className='bg-zinc-500'
          >
            {t('pages.settings.tabs.user.profile.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
