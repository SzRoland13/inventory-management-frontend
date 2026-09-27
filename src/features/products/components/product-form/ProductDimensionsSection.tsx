import { useTranslations } from 'next-intl';
import { Ruler } from 'lucide-react';
import { Input } from '@/features/shared/components/ui/input';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import type { ProductFormFields } from './formTypes';
import { FieldLabel, FormSection } from './FormSection';
import { numberInputClassName } from './styles';

export function ProductDimensionsSection({
  register,
  errors,
}: Pick<ProductFormFields, 'register' | 'errors'>) {
  const t = useTranslations();
  return (
    <FormSection
      title={t('pages.products.dialog.sections.dimensions')}
      icon={Ruler}
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {(['weight', 'width', 'height', 'depth'] as const).map((fieldName) => (
          <div key={fieldName}>
            <FieldLabel htmlFor={`product-${fieldName}`}>
              {t(`pages.products.fields.${fieldName}`)}
            </FieldLabel>
            <Input
              id={`product-${fieldName}`}
              {...register(fieldName)}
              className={numberInputClassName}
              type='number'
              min='0'
              step='any'
            />
            <ValidationMessage messageKey={errors[fieldName]?.message} />
          </div>
        ))}
      </div>
    </FormSection>
  );
}
