import { useForm } from 'react-hook-form';
import { CompanyService } from '@/lib/services/CompanyService';
import {
  CompanyBaseDataUpdateRequest,
  CompanyExtendedResponse,
} from '@/lib/services/dtos/companyDtos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useEffect } from 'react';
import { useFormChanges } from '@/lib/hooks/useFormChanges';
import CardWrapper from '@/components/common/CardWrapper';

type Props = {
  initialCompanyData?: CompanyExtendedResponse | null;
};

export default function BaseDataCard({ initialCompanyData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<CompanyBaseDataUpdateRequest>();

  const values = watch();

  const { hasChanges, setInitialValues, resetToInitial } =
    useFormChanges(values);

  useEffect(() => {
    if (initialCompanyData) {
      const values = {
        name: initialCompanyData.name ?? '',
        description: initialCompanyData.description ?? '',
        email: initialCompanyData.email ?? '',
        phone: initialCompanyData.phone ?? '',
        address: initialCompanyData.address ?? '',
        website: initialCompanyData.website ?? '',
      };

      setInitialValues(values);
      reset(values);
    }
  }, [initialCompanyData, reset, setInitialValues]);

  const t = useTranslations();
  const setCompanyData = useCompanyStore((state) => state.setCompanyData);

  const onSubmit = async (data: CompanyBaseDataUpdateRequest) => {
    const res = await CompanyService.updateCompanyBaseData(data);

    if (res.success && res.payload) {
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

      setInitialValues(values);
      reset(values);

      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  const handleReset = () => {
    const initial = resetToInitial();
    if (!initial) return;

    reset(initial);
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
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.name')}
          </Label>
          <Input
            {...register('name')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.description')}
          </Label>
          <Input
            {...register('description')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.email')}
          </Label>
          <Input
            {...register('email')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.phone')}
          </Label>
          <Input
            {...register('phone')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.address')}
          </Label>
          <Input
            {...register('address')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.data.fields.website')}
          </Label>
          <Input
            {...register('website')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
        </div>

        <Button
          type='submit'
          disabled={!hasChanges || isSubmitting}
          className='bg-zinc-500 mt-2 w-72  self-center'
        >
          {t('common.save')}
        </Button>
      </form>
    </CardWrapper>
  );
}
