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
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { MediaPreviewResponse } from '@/lib/services/dtos/mediaDtos';
import { CompanyService } from '@/lib/services/CompanyService';
import { useCompanyStore } from '@/lib/stores/companyStore';

export default function CompanyTab() {
  const [logo, setLogo] = useState<MediaPreviewResponse | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<number | null>(null);
  const companyLogoUrl = useCompanyStore((state) => state.logoUrl);
  const imageSrc = logo?.getUrl ?? companyLogoUrl ?? undefined;
  const setCompanyData = useCompanyStore((state) => state.setCompanyData);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    // Initialize presigned upload
    const initResp = await MediaService.initializeUpload({
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    setMediaAssetId(initResp.payload.id);

    // Upload the file
    await ObjectStorageService.putImage({
      url: initResp.payload.putUrl,
      file,
    });

    // Get preview URL
    const previewResp = await MediaService.getPreview(initResp.payload.id);
    setLogo(previewResp.payload);
  };

  const handleSaveLogo = async () => {
    if (!mediaAssetId) return;

    const companyId = useCompanyStore.getState().id;
    if (!companyId) return;

    const response = await CompanyService.updateLogo({
      mediaAssetId,
    });

    if (logo?.getUrl && logo.expiry && logo.id) {
      setCompanyData({
        logoId: logo.id,
        logoUrl: logo.getUrl,
        logoUrlExpiry: logo.expiry,
      });
    }

    toast(t(`messageKey.${response.messageKey}`));
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6'>
      {/* Company Logo Card */}
      <Card className='bg-zinc-800 border-zinc-700 shadow-xl'>
        <CardHeader className='flex flex-col gap-2'>
          <CardTitle className='text-xl font-semibold text-zinc-100'>
            {t('pages.settings.tabs.company.logo.title')}
          </CardTitle>
          <CardDescription className='text-zinc-400'>
            {t('pages.settings.tabs.company.logo.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className='flex flex-col items-center gap-6'>
          {/* Logo Upload */}
          <div
            className='relative group cursor-pointer'
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className='w-32 h-32 border border-zinc-700'>
              {imageSrc && <AvatarImage src={imageSrc} alt='Company logo' />}

              {!imageSrc && (
                <AvatarFallback className='bg-zinc-800 text-zinc-400'>
                  {t('pages.settings.tabs.company.logo.upload')}
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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />

          <Button
            onClick={handleSaveLogo}
            disabled={!mediaAssetId}
            className='bg-zinc-500'
          >
            {t('pages.settings.tabs.company.logo.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Placeholder for additional company settings */}
      <Card className='bg-zinc-800 border-zinc-700 shadow-xl'>
        <CardHeader>
          <CardTitle className='text-xl text-zinc-100'></CardTitle>
          <CardDescription className='text-zinc-400'></CardDescription>
        </CardHeader>

        <CardContent className='text-zinc-400 text-sm'></CardContent>
      </Card>
    </div>
  );
}
