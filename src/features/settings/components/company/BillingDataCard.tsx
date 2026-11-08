import CardWrapper from '@/features/shared/components/CardWrapper';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { useFormChanges } from '@/features/shared/hooks/useFormChanges';
import {
  CompanyBillingDataUpdateRequest,
  CompanyExtendedResponse,
} from '@/features/settings/types/companyDtos';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useUpdateCompanyBillingDataMutation } from '@/features/settings/queries/companyQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyBillingDataSchema } from '@/features/settings/schemas/companySchemas';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { euVatCountryCodes } from '@/features/shared/schemas/commonSchemas';

type Props = {
  initialCompanyData?: CompanyExtendedResponse | null;
};

export default function BillingDataCard({ initialCompanyData }: Props) {
  const {
    register,
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
  const currentVatNumber = values.vatNumber ?? '';
  const [euVatCountry, setEuVatCountry] = useState('HU');
  const taxNumberField = register('taxNumber');
  const vatSuffix = currentVatNumber.toUpperCase().startsWith(euVatCountry)
    ? currentVatNumber.slice(2)
    : currentVatNumber;

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

      const vatCountry = values.vatNumber.slice(0, 2).toUpperCase();
      setEuVatCountry(euVatCountryCodes.includes(vatCountry) ? vatCountry : 'HU');

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

      const vatCountry = values.vatNumber.slice(0, 2).toUpperCase();
      setEuVatCountry(euVatCountryCodes.includes(vatCountry) ? vatCountry : 'HU');

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
    const vatCountry = initial.vatNumber.slice(0, 2).toUpperCase();
    setEuVatCountry(euVatCountryCodes.includes(vatCountry) ? vatCountry : 'HU');
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
            {...taxNumberField}
            inputMode='numeric'
            maxLength={13}
            placeholder='12345678-1-12'
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
              const core = digits.slice(0, 8);
              const status = digits.slice(8, 9);
              const office = digits.slice(9, 11);
              const formatted = [core, status, office]
                .filter((part, index) => part || index === 0)
                .join('-');
              setValue('taxNumber', formatted, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.taxNumber?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.billing.fields.vatNumber')}
          </Label>
          <div className='flex gap-2'>
            <Select
              value={euVatCountry}
              onValueChange={(country) => {
                const suffix = currentVatNumber.replace(/^[A-Z]{2}/i, '');
                setEuVatCountry(country);
                setValue('vatNumber', suffix ? `${country}${suffix}` : '', {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger className='w-24 border-zinc-700 bg-zinc-900 text-zinc-100'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                {euVatCountryCodes.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={vatSuffix}
              maxLength={48}
              onChange={(event) =>
                setValue(
                  'vatNumber',
                  event.target.value ? `${euVatCountry}${event.target.value}` : '',
                  { shouldDirty: true, shouldValidate: true },
                )
              }
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>
          <ValidationMessage messageKey={errors.vatNumber?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.billing.fields.registrationNumber')}
          </Label>
          <Input
            {...register('registrationNumber')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.registrationNumber?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.billing.fields.bankAccount')}
          </Label>
          <Input
            {...register('bankAccount')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.bankAccount?.message} />
        </div>

        <div className='flex flex-col gap-2'>
          <Label className='text-zinc-400'>
            {t('pages.settings.tabs.company.billing.fields.iban')}
          </Label>
          <Input
            {...register('iban')}
            className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
          />
          <ValidationMessage messageKey={errors.iban?.message} />
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
