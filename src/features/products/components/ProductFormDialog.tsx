'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import {
  createProductFormSchema,
  productFormToRequest,
  type ProductFormValues,
} from '@/features/products/schemas/productSchemas';
import {
  ProductStatus,
  type ProductAttributeDefinition,
  type ProductCategory,
  type ProductRequest,
  type ProductResponse,
  type ProductUnit,
} from '@/features/products/types/product';
import type { Currency } from '@/features/settings/types/currencyDtos';
import { valuesFromProduct } from '@/features/products/helpers/productFormValues';
import { ProductAttributesSection } from './product-form/ProductAttributesSection';
import { ProductCategoriesSection } from './product-form/ProductCategoriesSection';
import { ProductDetailsSection } from './product-form/ProductDetailsSection';
import { ProductDimensionsSection } from './product-form/ProductDimensionsSection';
import { ProductUnitsPricingSection } from './product-form/ProductUnitsPricingSection';
import { ProductFormDialogFooter } from './product-form/ProductFormDialogFooter';
import { ProductFormDialogHeader } from './product-form/ProductFormDialogHeader';
import { ProductFormDialogLoading } from './product-form/ProductFormDialogLoading';

interface ProductFormDialogProps {
  open: boolean;
  editing: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse;
  isLoadingProduct?: boolean;
  saving: boolean;
  units: ProductUnit[];
  currencies: Currency[];
  categories: ProductCategory[];
  definitions: ProductAttributeDefinition[];
  onSave: (
    request: ProductRequest,
    status?: ProductRequest['status'],
  ) => Promise<void>;
}

export function ProductFormDialog({
  open,
  editing,
  onOpenChange,
  product,
  isLoadingProduct = false,
  saving,
  units,
  currencies,
  categories,
  definitions,
  onSave,
}: ProductFormDialogProps) {
  const schema = useMemo(
    () => createProductFormSchema(definitions),
    [definitions],
  );
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFromProduct(undefined, definitions),
  });
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  useEffect(() => {
    if (open && !isLoadingProduct && !isDirty) {
      reset(valuesFromProduct(product, definitions));
    }
  }, [definitions, isDirty, isLoadingProduct, open, product, reset]);

  const submit = (status?: ProductRequest['status']) =>
    handleSubmit(async (values) => {
      const request = productFormToRequest(values, definitions);
      await onSave(request, editing ? request.status : status);
    })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent className='!w-[96vw] !max-w-[88rem] flex max-h-[92dvh] flex-col gap-0 overflow-hidden border-zinc-700 bg-zinc-900 p-0 shadow-black/50'>
        <ProductFormDialogHeader editing={editing} />

        {isLoadingProduct ? (
          <ProductFormDialogLoading />
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit(editing ? undefined : ProductStatus.DRAFT);
            }}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='min-h-0 flex-1 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 py-5 sm:px-8'>
              <ProductDetailsSection
                key={open ? 'open' : 'closed'}
                control={control}
                register={register}
                errors={errors}
                editing={editing}
                open={open}
                product={product}
              />

              <ProductUnitsPricingSection
                control={control}
                register={register}
                errors={errors}
                units={units}
                currencies={currencies}
              />

              <ProductDimensionsSection register={register} errors={errors} />

              <ProductCategoriesSection
                control={control}
                categories={categories}
              />

              <ProductAttributesSection
                control={control}
                errors={errors}
                definitions={definitions}
              />
            </div>

            <ProductFormDialogFooter
              editing={editing}
              busy={saving || isSubmitting}
              onCancel={() => onOpenChange(false)}
              onSave={() =>
                void submit(editing ? undefined : ProductStatus.DRAFT)
              }
              onPublish={() => void submit(ProductStatus.ACTIVE)}
            />
          </form>
        )}
      </ThemedDialogContent>
    </Dialog>
  );
}
