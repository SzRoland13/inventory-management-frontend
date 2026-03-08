import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { CompanyService } from '@/lib/services/CompanyService';
import { CompanyBaseDataUpdateRequest } from '@/lib/services/dtos/companyDtos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCompanyStore } from '@/lib/stores/companyStore';

export default function CompanyTabDataCard() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<CompanyBaseDataUpdateRequest>();
  const t = useTranslations();
  const setCompanyData = useCompanyStore((state) => state.setCompanyData);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      const res = await CompanyService.getExtendedCompanyData();

      if (res.success && res.payload) {
        reset({
          name: res.payload.name ?? '',
          description: res.payload.description ?? '',
          email: res.payload.email ?? '',
          phone: res.payload.phone ?? '',
          address: res.payload.address ?? '',
          website: res.payload.website ?? '',
        });
      }

      setLoading(false);
    };

    loadCompany();
  }, [reset]);

  const onSubmit = async (data: CompanyBaseDataUpdateRequest) => {
    const res = await CompanyService.updateCompanyBaseData(data);

    if (res.success && res.payload) {
      setCompanyData({
        name: res.payload.name,
      });
      reset(res.payload);
      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  return (
    <Card className='bg-zinc-800 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl text-zinc-100'>
          {t('pages.settings.tabs.company.data.title')}
        </CardTitle>

        <CardDescription className='text-zinc-400'>
          {t('pages.settings.tabs.company.data.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className='text-zinc-400 text-sm'>Loading...</p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <div className='flex flex-col gap-2'>
              <Label className='text-zinc-400'>
                {t('pages.settings.tabs.company.data.fields.name')}
              </Label>
              <Input {...register('name')} />
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-zinc-400'>
                {t('pages.settings.tabs.company.data.fields.description')}
              </Label>
              <Input {...register('description')} />
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-zinc-400'>
                {t('pages.settings.tabs.company.data.fields.email')}
              </Label>
              <Input {...register('email')} />
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-zinc-400'>
                {t('pages.settings.tabs.company.data.fields.phone')}
              </Label>
              <Input {...register('phone')} />
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-zinc-400'>
                {t('pages.settings.tabs.company.data.fields.address')}
              </Label>
              <Input {...register('address')} />
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-zinc-400'>
                {t('pages.settings.tabs.company.data.fields.website')}
              </Label>
              <Input {...register('website')} />
            </div>

            <Button
              type='submit'
              disabled={!isDirty || isSubmitting}
              className='bg-zinc-500 mt-2'
            >
              {t('common.save')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
