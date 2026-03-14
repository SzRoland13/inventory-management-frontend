import CardWrapper from '@/components/common/CardWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormChanges } from '@/lib/hooks/useFormChanges';
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

export default function BillingDataCard({ initialCompanyData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<CompanyBillingDataUpdateRequest>();

  const values = watch();

  const { hasChanges, setInitialValues, resetToInitial } =
    useFormChanges(values);

  useEffect(() => {
    if (initialCompanyData) {
      const values = {
        taxNumber: initialCompanyData?.taxNumber,
        vatNumber: initialCompanyData?.vatNumber,
        registrationNumber: initialCompanyData?.registrationNumber,
        bankAccount: initialCompanyData?.bankAccount,
        iban: initialCompanyData?.iban,
      };

      setInitialValues(values);
      reset(values);
    }
  }, [initialCompanyData, reset, setInitialValues]);

  const t = useTranslations();

  const onSubmit = async (data: CompanyBillingDataUpdateRequest) => {
    const res = await CompanyService.updateCompanyBillingData(data);

    if (res.success && res.payload) {
      const values = {
        taxNumber: res.payload.taxNumber,
        vatNumber: res.payload.vatNumber,
        registrationNumber: res.payload.registrationNumber,
        bankAccount: res.payload.bankAccount,
        iban: res.payload.iban,
      };

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
      title={t('pages.settings.tabs.company.billing.title')}
      description={t('pages.settings.tabs.company.billing.description')}
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
            {t('pages.settings.tabs.company.billing.fields.registrationNumber')}
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
          disabled={!hasChanges || isSubmitting}
          className='bg-zinc-500 mt-2'
        >
          {t('common.save')}
        </Button>
      </form>
    </CardWrapper>
  );
}
