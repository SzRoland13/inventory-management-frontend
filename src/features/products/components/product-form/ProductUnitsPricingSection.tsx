import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { BadgeDollarSign } from 'lucide-react';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import type { ProductUnit } from '@/features/products/types/product';
import type { Currency } from '@/features/settings/types/currencyDtos';
import type { ProductFormFields } from './formTypes';
import { FieldLabel, FormSection } from './FormSection';
import { numberInputClassName, productSelectTriggerClassName } from './styles';

type ProductUnitsPricingSectionProps = ProductFormFields & {
  units: ProductUnit[];
  currencies: Currency[];
};

export function ProductUnitsPricingSection({
  control,
  register,
  errors,
  units,
  currencies,
}: ProductUnitsPricingSectionProps) {
  const t = useTranslations();
  return (
    <FormSection
      title={t('pages.products.dialog.sections.units-pricing')}
      icon={BadgeDollarSign}
    >
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-lg border border-zinc-700/70 bg-zinc-900/60 p-4'>
          <h4 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400'>
            {t('pages.products.dialog.groups.units')}
          </h4>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <FieldLabel required>
                {t('pages.products.fields.main-unit')}
              </FieldLabel>
              <Controller
                control={control}
                name='mainUnitId'
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      aria-label={t('pages.products.fields.main-unit')}
                      className={productSelectTriggerClassName}
                    >
                      <SelectValue
                        placeholder={t('pages.products.fields.select-unit')}
                      />
                    </SelectTrigger>
                    <SelectContent
                      position='popper'
                      side='bottom'
                      avoidCollisions={false}
                      className='border-zinc-700 bg-zinc-800 text-zinc-100'
                    >
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ValidationMessage messageKey={errors.mainUnitId?.message} />
            </div>
            <div>
              <FieldLabel>
                {t('pages.products.fields.secondary-unit')}
              </FieldLabel>
              <Controller
                control={control}
                name='secondaryUnitId'
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value || 'NONE'}
                    onValueChange={(value) =>
                      field.onChange(value === 'NONE' ? '' : value)
                    }
                  >
                    <SelectTrigger
                      aria-label={t('pages.products.fields.secondary-unit')}
                      className={productSelectTriggerClassName}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position='popper'
                      side='bottom'
                      avoidCollisions={false}
                      className='border-zinc-700 bg-zinc-800 text-zinc-100'
                    >
                      <SelectItem value='NONE'>
                        {t('pages.products.fields.no-secondary-unit')}
                      </SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ValidationMessage messageKey={errors.secondaryUnitId?.message} />
            </div>
            <div>
              <FieldLabel htmlFor='product-secondary-units-per-main'>
                {t('pages.products.fields.secondary-units-per-main')}
              </FieldLabel>
              <Input
                id='product-secondary-units-per-main'
                {...register('secondaryUnitsPerMainUnit')}
                className={numberInputClassName}
                type='number'
                min='0'
                step='any'
              />
              <ValidationMessage
                messageKey={errors.secondaryUnitsPerMainUnit?.message}
              />
            </div>
          </div>
        </div>
        <div className='rounded-lg border border-zinc-700/70 bg-zinc-900/60 p-4'>
          <h4 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400'>
            {t('pages.products.dialog.groups.pricing')}
          </h4>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <FieldLabel>{t('pages.products.fields.currency')}</FieldLabel>
              <Controller
                control={control}
                name='currencyId'
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value || 'NONE'}
                    onValueChange={(value) =>
                      field.onChange(value === 'NONE' ? '' : value)
                    }
                  >
                    <SelectTrigger
                      aria-label={t('pages.products.fields.currency')}
                      className={productSelectTriggerClassName}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position='popper'
                      side='bottom'
                      avoidCollisions={false}
                      className='border-zinc-700 bg-zinc-800 text-zinc-100'
                    >
                      <SelectItem value='NONE'>
                        {t('pages.products.fields.no-currency')}
                      </SelectItem>
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.id}
                          value={String(currency.id)}
                        >
                          {currency.code} — {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ValidationMessage messageKey={errors.currencyId?.message} />
            </div>
            <div>
              <FieldLabel htmlFor='product-net-price' required>
                {t('pages.products.fields.net-price')}
              </FieldLabel>
              <Input
                id='product-net-price'
                {...register('netPrice')}
                className={numberInputClassName}
                type='number'
                min='0'
                step='any'
              />
              <ValidationMessage messageKey={errors.netPrice?.message} />
            </div>
            <div>
              <FieldLabel htmlFor='product-cost-price'>
                {t('pages.products.fields.cost-price')}
              </FieldLabel>
              <Input
                id='product-cost-price'
                {...register('costPrice')}
                className={numberInputClassName}
                type='number'
                min='0'
                step='any'
              />
              <ValidationMessage messageKey={errors.costPrice?.message} />
            </div>
            <div>
              <FieldLabel htmlFor='product-vat-rate' required>
                {t('pages.products.fields.vat-rate')}
              </FieldLabel>
              <Input
                id='product-vat-rate'
                {...register('vatRate')}
                className={numberInputClassName}
                type='number'
                min='0'
                max='99.999'
                step='any'
              />
              <ValidationMessage messageKey={errors.vatRate?.message} />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
