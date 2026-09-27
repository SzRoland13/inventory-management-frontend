import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Tags } from 'lucide-react';
import type { ProductCategory } from '@/features/products/types/product';
import type { ProductFormFields } from './formTypes';
import { CategoryPicker } from './CategoryPicker';
import { FormSection } from './FormSection';

export function ProductCategoriesSection({
  control,
  categories,
}: Pick<ProductFormFields, 'control'> & { categories: ProductCategory[] }) {
  const t = useTranslations();
  if (categories.length === 0) return null;

  return (
    <FormSection
      title={t('pages.products.dialog.sections.categories')}
      icon={Tags}
    >
      <Controller
        control={control}
        name='categoryIds'
        render={({ field }) => (
          <CategoryPicker
            categories={categories}
            selectedIds={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </FormSection>
  );
}
