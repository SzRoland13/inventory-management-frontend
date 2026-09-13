import CardWrapper from '@/components/common/CardWrapper';
import { AvatarImage, AvatarFallback, Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { toast } from 'sonner';
import { useMediaUploadMutation } from '@/lib/queries/mediaQueries';
import { useUpdateCompanyLogoMutation } from '@/lib/queries/companyQueries';
import { getApiErrorMessageKey } from '@/lib/queries/apiResponse';

export default function LogoCard() {
  const companyLogoUrl = useCompanyStore((state) => state.logoUrl);
  const setCompanyData = useCompanyStore((state) => state.setCompanyData);

  const uploadMedia = useMediaUploadMutation();
  const updateLogo = useUpdateCompanyLogoMutation();

  const logo = uploadMedia.data?.payload ?? null;
  const imageSrc = logo?.getUrl ?? companyLogoUrl ?? undefined;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    try {
      await uploadMedia.mutateAsync(file);
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
    }
  };

  const handleSaveLogo = async () => {
    const mediaAssetId = logo?.id;
    if (!mediaAssetId) return;

    const companyId = useCompanyStore.getState().id;
    if (!companyId) {
      toast.error(t('messagekey.error.generic'));
      return;
    }

    try {
      const response = await updateLogo.mutateAsync({ mediaAssetId });

      if (logo?.getUrl && logo.expiry && logo.id) {
        setCompanyData({
          logoId: logo.id,
          logoUrl: logo.getUrl,
          logoUrlExpiry: logo.expiry,
        });
      }

      toast(t(`messagekey.${response.messageKey}`));
    } catch (error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
    }
  };

  return (
    <CardWrapper
      title={t('pages.settings.tabs.company.logo.title')}
      description={t('pages.settings.tabs.company.logo.description')}
      cardContentExtraClass='flex flex-col items-center gap-6'
    >
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
        disabled={!logo?.id}
        className='bg-zinc-500 w-72'
      >
        {t('pages.settings.tabs.company.logo.save')}
      </Button>
    </CardWrapper>
  );
}
