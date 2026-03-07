'use client';

import { Button } from '@/components/ui/button';
import { MediaService } from '@/lib/services/MediaService';
import { ObjectStorageService } from '@/lib/services/ObjectStorageService';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

export default function UserTab() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<number | null>(null);

  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // initialize upload to get putUrl
    const initResp = await MediaService.initializeUpload({
      filename: file.name,
      mimeType: file.type,
    });

    setMediaAssetId(initResp.payload.id);

    // upload file using presigned URL
    await ObjectStorageService.putImage({
      url: initResp.payload.putUrl,
      file,
    });

    // get preview
    const previewResp = await MediaService.getPreview(initResp.payload.id);
    setPreviewUrl(previewResp.payload.getUrl);
  };

  const handleSaveAvatar = async () => {
    if (!mediaAssetId) return;

    // call backend endpoint to save avatar
    await fetch(`/api/v1/user/1/avatar`, {
      // replace 1 with current user id
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaAssetId }),
    });

    toast(t(''));
  };

  return (
    <div className='flex flex-col gap-4'>
      <input type='file' accept='image/*' onChange={handleFileChange} />
      {previewUrl && (
        <Image
          src={previewUrl}
          width={32}
          height={32}
          alt='Avatar Preview'
          className='w-32 h-32 rounded-full'
        />
      )}
      <Button onClick={handleSaveAvatar} disabled={!previewUrl}>
        Save Avatar
      </Button>
    </div>
  );
}
