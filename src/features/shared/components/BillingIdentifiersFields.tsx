'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import { euVatCountryCodes } from '@/features/shared/schemas/commonSchemas';

export type BillingIdentifierField =
  | 'taxNumber'
  | 'vatNumber'
  | 'registrationNumber'
  | 'bankAccount'
  | 'iban';

export type BillingIdentifierValues = Record<BillingIdentifierField, string>;

type Props = {
  values: BillingIdentifierValues;
  errors: Partial<Record<BillingIdentifierField, string | undefined>>;
  labelPrefix: string;
  requiredFields?: readonly BillingIdentifierField[];
  onChange: (field: BillingIdentifierField, value: string) => void;
};

const inputClassName =
  'border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400';

export function BillingIdentifiersFields({
  values,
  errors,
  labelPrefix,
  requiredFields = [],
  onChange,
}: Props) {
  const t = useTranslations();
  const currentCountry = values.vatNumber.slice(0, 2).toUpperCase();
  const [selectedCountry, setSelectedCountry] = useState('HU');
  const vatCountry = euVatCountryCodes.includes(currentCountry)
    ? currentCountry
    : selectedCountry;
  const vatSuffix = currentCountry === vatCountry
    ? values.vatNumber.slice(2)
    : values.vatNumber;

  const label = (field: BillingIdentifierField) => (
    <Label className='text-zinc-400' htmlFor={`billing-${field}`}>
      {t(`${labelPrefix}.${field}`)}
      {requiredFields.includes(field) ? ' *' : ''}
    </Label>
  );

  const input = (
    field: Exclude<BillingIdentifierField, 'taxNumber' | 'vatNumber'>,
    maxLength: number,
  ) => (
    <div className='flex flex-col gap-2'>
      {label(field)}
      <Input
        id={`billing-${field}`}
        value={values[field]}
        maxLength={maxLength}
        aria-required={requiredFields.includes(field)}
        aria-invalid={!!errors[field]}
        onChange={(event) => onChange(field, event.target.value)}
        className={inputClassName}
      />
      <ValidationMessage messageKey={errors[field]} />
    </div>
  );

  const formatTaxNumber = (digits: string) => {
    const core = digits.slice(0, 8);
    const status = digits.slice(8, 9);
    const office = digits.slice(9, 11);
    return [core, status, office]
      .filter((part, index) => part || index === 0)
      .join('-');
  };

  return (
    <div className='grid gap-4'>
      <div className='flex flex-col gap-2'>
        {label('taxNumber')}
        <Input
          id='billing-taxNumber'
          value={values.taxNumber}
          inputMode='numeric'
          maxLength={13}
          placeholder='12345678-1-12'
          aria-required={requiredFields.includes('taxNumber')}
          aria-invalid={!!errors.taxNumber}
          onChange={(event) =>
            onChange('taxNumber', formatTaxNumber(event.target.value.replace(/\D/g, '').slice(0, 11)))
          }
          className={inputClassName}
        />
        <ValidationMessage messageKey={errors.taxNumber} />
      </div>

      <div className='flex flex-col gap-2'>
        {label('vatNumber')}
        <div className='flex gap-2'>
          <Select
            value={vatCountry}
            onValueChange={(country) => {
              const suffix = values.vatNumber.replace(/^[A-Z]{2}/i, '');
              setSelectedCountry(country);
              onChange('vatNumber', suffix ? `${country}${suffix}` : '');
            }}
          >
            <SelectTrigger
              id='billing-vatCountry'
              aria-label={t(`${labelPrefix}.vatNumber`)}
              className='w-24 shrink-0 border-zinc-700 bg-zinc-900 text-zinc-100'
            >
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
            id='billing-vatNumber'
            value={vatSuffix}
            maxLength={48}
            aria-required={requiredFields.includes('vatNumber')}
            aria-invalid={!!errors.vatNumber}
            onChange={(event) =>
              onChange(
                'vatNumber',
                event.target.value ? `${vatCountry}${event.target.value}` : '',
              )
            }
            className={inputClassName}
          />
        </div>
        <ValidationMessage messageKey={errors.vatNumber} />
      </div>

      {input('registrationNumber', 100)}
      {input('bankAccount', 100)}
      {input('iban', 50)}
    </div>
  );
}
