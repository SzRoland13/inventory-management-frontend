'use client';

import { useState } from 'react';
import MainHeader from '@/components/common/MainHeader';
import { Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MediaService } from '@/lib/services/MediaService';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { SettingsTab } from '@/lib/enums/settings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.General);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<number | null>(null);

  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setAvatarFile(file);

    // initialize upload to get putUrl
    const initResp = await MediaService.initializeUpload({
      filename: file.name,
      mimeType: file.type,
    });

    setMediaAssetId(initResp.payload.id);

    // upload file using presigned URL
    await fetch(initResp.payload.putUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
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
    <div className='flex flex-col w-full'>
      <MainHeader title='Settings' icon={<Settings className='w-6 h-6' />} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='general'>General</TabsTrigger>
          <TabsTrigger value='user'>User</TabsTrigger>
          <TabsTrigger value='product'>Product</TabsTrigger>
          <TabsTrigger value='company'>Company</TabsTrigger>
        </TabsList>

        <TabsContent value='general'>
          <p>General settings go here...</p>
        </TabsContent>

        <TabsContent value='user'>
          <div className='flex flex-col gap-4'>
            <input type='file' accept='image/*' onChange={handleFileChange} />
            {previewUrl && (
              <img
                src={previewUrl}
                alt='Avatar Preview'
                className='w-32 h-32 rounded-full'
              />
            )}
            <Button onClick={handleSaveAvatar} disabled={!previewUrl}>
              Save Avatar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value='product'>
          <p>Product settings...</p>
        </TabsContent>

        <TabsContent value='company'>
          <p>Company settings...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
