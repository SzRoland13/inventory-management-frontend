import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CompanyBaseDataUpdateRequest,
  CompanyExtendedResponse,
} from '@/features/settings/types/companyDtos';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Button } from '@/features/shared/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCompanyStore } from '@/features/settings/stores/companyStore';
import { useEffect, useState } from 'react';
import CardWrapper from '@/features/shared/components/CardWrapper';
import { useUpdateCompanyBaseDataMutation } from '@/features/settings/queries/companyQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { companyBaseDataSchema } from '@/features/settings/schemas/companySchemas';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';

type Props = {
  initialCompanyData?: CompanyExtendedResponse | null;
};

export default function BaseDataCard({ initialCompanyData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CompanyBaseDataUpdateRequest>({
    resolver: zodResolver(companyBaseDataSchema),
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialCompanyData && !hasChanges) {
      const values = {
        name: initialCompanyData.name ?? '',
        description: initialCompanyData.description ?? '',
        email: initialCompanyData.email ?? '',
        phone: initialCompanyData.phone ?? '',
        address: initialCompanyData.address ?? '',
        website: initialCompanyData.website ?? '',
      };

      reset(values);
    }
  }, [initialCompanyData, hasChanges, reset]);

  const t = useTranslations();
  const setCompanyData = useCompanyStore((state) => state.setCompanyData);
  const updateBaseData = useUpdateCompanyBaseDataMutation();

  const onSubmit = async (data: CompanyBaseDataUpdateRequest) => {
    try {
      const res = await updateBaseData.mutateAsync(data);

      const values = {
        name: res.payload.name ?? '',
        description: res.payload.description ?? '',
        email: res.payload.email ?? '',
        phone: res.payload.phone ?? '',
        address: res.payload.address ?? '',
        website: res.payload.website ?? '',
      };

      setCompanyData({
        id: res.payload.id,
        name: res.payload.name,
      });

      reset(values);
      setHasChanges(false);

      toast(t(`messagekey.${res.messageKey}`));
    } catch (error) {
      toastApiError(t, error);
    }
  };

  const handleReset = () => {
    if (!initialCompanyData) return;
    reset({
      name: initialCompanyData.name ?? '',
      description: initialCompanyData.description ?? '',
      email: initialCompanyData.email ?? '',
      phone: initialCompanyData.phone ?? '',
      address: initialCompanyData.address ?? '',
      website: initialCompanyData.website ?? '',
    });
    setHasChanges(false);
  };

  return (
    <CardWrapper
      title={t('pages.settings.tabs.company.data.title')}
      description={t('pages.settings.tabs.company.data.description')}
      headerAction={
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!hasChanges}
          onClick={handleReset}
        >
          {t('common.reset')}
        </Button>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => setHasChanges(true)}
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.name')}
          </Label>
          <Input
            {...register('name')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.name?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.description')}
          </Label>
          <Input
            {...register('description')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.description?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.email')}
          </Label>
          <Input
            {...register('email')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.email?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.phone')}
          </Label>
          <Input
            type='tel'
            {...register('phone')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.phone?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.address')}
          </Label>
          <Input
            {...register('address')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.address?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.website')}
          </Label>
          <Input
            {...register('website')}
            maxLength={2048}
            placeholder='https://example.com'
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.website?.message} />
        </div>

        <Button
          type='submit'
          disabled={!hasChanges || isSubmitting}
          variant='mutedSolid' className='mt-2 w-72 self-center'
        >
          {t('common.save')}
        </Button>
      </form>
    </CardWrapper>
  );
}
