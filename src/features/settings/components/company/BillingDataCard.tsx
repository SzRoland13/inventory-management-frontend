import CardWrapper from '@/features/shared/components/CardWrapper';
import { Button } from '@/features/shared/components/ui/button';
import { useFormChanges } from '@/features/shared/hooks/useFormChanges';
import {
  CompanyBillingDataUpdateRequest,
  CompanyExtendedResponse,
} from '@/features/settings/types/companyDtos';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useUpdateCompanyBillingDataMutation } from '@/features/settings/queries/companyQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyBillingDataSchema } from '@/features/settings/schemas/companySchemas';
import { BillingIdentifiersFields } from '@/features/shared/components/BillingIdentifiersFields';

type Props = {
  initialCompanyData?: CompanyExtendedResponse | null;
};

export default function BillingDataCard({ initialCompanyData }: Props) {
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<CompanyBillingDataUpdateRequest>({
    resolver: zodResolver(companyBillingDataSchema),
    defaultValues: {
      taxNumber: '',
      vatNumber: '',
      registrationNumber: '',
      bankAccount: '',
      iban: '',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();
  const { hasChanges, setInitialValues, resetToInitial } =
    useFormChanges(values);

  useEffect(() => {
    if (initialCompanyData && !hasChanges) {
      const values = {
        taxNumber: initialCompanyData.taxNumber ?? '',
        vatNumber: initialCompanyData.vatNumber ?? '',
        registrationNumber: initialCompanyData.registrationNumber ?? '',
        bankAccount: initialCompanyData.bankAccount ?? '',
        iban: initialCompanyData.iban ?? '',
      };

      setInitialValues(values);
      reset(values);
    }
  }, [initialCompanyData, hasChanges, reset, setInitialValues]);

  const t = useTranslations();
  const updateBillingData = useUpdateCompanyBillingDataMutation();

  const onSubmit = async (data: CompanyBillingDataUpdateRequest) => {
    try {
      const res = await updateBillingData.mutateAsync(data);

      const values = {
        taxNumber: res.payload.taxNumber ?? '',
        vatNumber: res.payload.vatNumber ?? '',
        registrationNumber: res.payload.registrationNumber ?? '',
        bankAccount: res.payload.bankAccount ?? '',
        iban: res.payload.iban ?? '',
      };

      setInitialValues(values);
      reset(values);

      toast(t(`messagekey.${res.messageKey}`));
    } catch (error) {
      toastApiError(t, error);
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
        <BillingIdentifiersFields
          values={values}
          errors={{
            taxNumber: errors.taxNumber?.message,
            vatNumber: errors.vatNumber?.message,
            registrationNumber: errors.registrationNumber?.message,
            bankAccount: errors.bankAccount?.message,
            iban: errors.iban?.message,
          }}
          labelPrefix='pages.settings.tabs.company.billing.fields'
          onChange={(field, value) =>
            setValue(field, value, { shouldDirty: true, shouldValidate: true })
          }
        />

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
