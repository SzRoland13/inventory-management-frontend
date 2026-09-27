import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import {
  ProductAttributeValueType,
  type ProductAttributeDefinition,
} from '@/features/products/types/product';
import type { ProductFormFields } from './formTypes';
import { FieldLabel, FormSection } from './FormSection';
import { numberInputClassName, productSelectTriggerClassName } from './styles';

type ProductAttributesSectionProps = Pick<
  ProductFormFields,
  'control' | 'errors'
> & {
  definitions: ProductAttributeDefinition[];
};

export function ProductAttributesSection({
  control,
  errors,
  definitions,
}: ProductAttributesSectionProps) {
  const t = useTranslations();
  if (definitions.length === 0) return null;

  return (
    <FormSection
      title={t('pages.products.dialog.sections.attributes')}
      icon={SlidersHorizontal}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        {definitions.map((definition, index) => (
          <div key={definition.id}>
            <FieldLabel
              htmlFor={
                definition.valueType === ProductAttributeValueType.FIXED ||
                definition.valueType === ProductAttributeValueType.BOOLEAN
                  ? undefined
                  : `product-attribute-${definition.id}`
              }
              required={definition.required}
            >
              {definition.name}
            </FieldLabel>
            <Controller
              control={control}
              name={`attributes.${index}.value`}
              render={({ field }) => {
                if (definition.valueType === ProductAttributeValueType.FIXED) {
                  return (
                    <Select
                      name={field.name}
                      value={field.value || 'NONE'}
                      onValueChange={(value) =>
                        field.onChange(value === 'NONE' ? '' : value)
                      }
                    >
                      <SelectTrigger
                        aria-label={definition.name}
                        className={productSelectTriggerClassName}
                      >
                        <SelectValue
                          placeholder={t('pages.products.fields.select-value')}
                        />
                      </SelectTrigger>
                      <SelectContent
                        position='popper'
                        side='bottom'
                        avoidCollisions={false}
                        className='border-zinc-700 bg-zinc-800 text-zinc-100'
                      >
                        <SelectItem value='NONE'>
                          {t('pages.products.fields.no-value')}
                        </SelectItem>
                        {definition.options.map((option) => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }
                if (
                  definition.valueType === ProductAttributeValueType.BOOLEAN
                ) {
                  return (
                    <Select
                      name={field.name}
                      value={field.value || 'NONE'}
                      onValueChange={(value) =>
                        field.onChange(value === 'NONE' ? '' : value)
                      }
                    >
                      <SelectTrigger
                        aria-label={definition.name}
                        className={productSelectTriggerClassName}
                      >
                        <SelectValue
                          placeholder={t('pages.products.fields.select-value')}
                        />
                      </SelectTrigger>
                      <SelectContent
                        position='popper'
                        side='bottom'
                        avoidCollisions={false}
                        className='border-zinc-700 bg-zinc-800 text-zinc-100'
                      >
                        <SelectItem value='NONE'>
                          {t('pages.products.fields.no-value')}
                        </SelectItem>
                        <SelectItem value='true'>{t('common.yes')}</SelectItem>
                        <SelectItem value='false'>{t('common.no')}</SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }
                return (
                  <Input
                    id={`product-attribute-${definition.id}`}
                    aria-label={definition.name}
                    {...field}
                    value={field.value}
                    type={
                      definition.valueType === ProductAttributeValueType.DATE
                        ? 'date'
                        : definition.valueType ===
                            ProductAttributeValueType.NUMBER
                          ? 'number'
                          : 'text'
                    }
                    className={
                      definition.valueType === ProductAttributeValueType.NUMBER
                        ? numberInputClassName
                        : undefined
                    }
                    step={
                      definition.valueType === ProductAttributeValueType.NUMBER
                        ? 'any'
                        : undefined
                    }
                  />
                );
              }}
            />
            <ValidationMessage
              messageKey={errors.attributes?.[index]?.value?.message}
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
}
