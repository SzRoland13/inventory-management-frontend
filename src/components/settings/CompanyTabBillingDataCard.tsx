import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompanyService } from '@/lib/services/CompanyService';
import {
  CompanyBillingDataUpdateRequest,
  CompanyExtendedResponse,
} from '@/lib/services/dtos/companyDtos';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type Props = {
  initialCompanyData?: CompanyExtendedResponse | null;
};

export default function CompanyTabBillingDataCard({
  initialCompanyData,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { dirtyFields, isSubmitting },
  } = useForm<CompanyBillingDataUpdateRequest>();

  useEffect(() => {
    if (initialCompanyData) {
      reset({
        taxNumber: initialCompanyData?.taxNumber,
        vatNumber: initialCompanyData?.vatNumber,
        registrationNumber: initialCompanyData?.registrationNumber,
        bankAccount: initialCompanyData?.bankAccount,
        iban: initialCompanyData?.iban,
      });
    }
  }, [initialCompanyData, reset]);

  const t = useTranslations();

  const onSubmit = async (data: CompanyBillingDataUpdateRequest) => {
    const res = await CompanyService.updateCompanyBillingData(data);

    if (res.success && res.payload) {
      reset(res.payload, { keepDirtyValues: false });
      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  return (
    <Card className='bg-zinc-800 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl text-zinc-100'>
          {t('pages.settings.tabs.company.billing.title')}
        </CardTitle>

        <CardDescription className='text-zinc-400'>
          {t('pages.settings.tabs.company.billing.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.billing.fields.taxNumber')}
            </Label>
            <Input
              {...register('taxNumber')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.billing.fields.vatNumber')}
            </Label>
            <Input
              {...register('vatNumber')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t(
                'pages.settings.tabs.company.billing.fields.registrationNumber',
              )}
            </Label>
            <Input
              {...register('registrationNumber')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.billing.fields.bankAccount')}
            </Label>
            <Input
              {...register('bankAccount')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.billing.fields.iban')}
            </Label>
            <Input
              {...register('iban')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <Button
            type='submit'
            disabled={!Object.keys(dirtyFields).length || isSubmitting}
            className='bg-zinc-500 mt-2'
          >
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
