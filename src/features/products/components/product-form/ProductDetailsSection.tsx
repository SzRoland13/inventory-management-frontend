import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Check, ChevronDown, ClipboardList } from 'lucide-react';
import { useBrandsQuery } from '@/features/brands/queries/brandQueries';
import { Button } from '@/features/shared/components/ui/button';
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
  ProductStatus,
  type ProductResponse,
} from '@/features/products/types/product';
import type { ProductFormFields } from './formTypes';
import { FieldLabel, FormSection } from './FormSection';
import { productSelectTriggerClassName } from './styles';

type ProductDetailsSectionProps = ProductFormFields & {
  editing: boolean;
  open: boolean;
  product?: ProductResponse;
};

export function ProductDetailsSection({
  control,
  register,
  errors,
  editing,
  open,
  product,
}: ProductDetailsSectionProps) {
  const t = useTranslations();
  const [brandSearch, setBrandSearch] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [debouncedBrandSearch, setDebouncedBrandSearch] = useState('');
  const brandsQuery = useBrandsQuery(debouncedBrandSearch, open);
  const availableBrands = brandsQuery.data?.payload ?? [];
  const brands =
    product?.brand &&
    !availableBrands.some((brand) => brand.id === product.brand?.id)
      ? [product.brand, ...availableBrands]
      : availableBrands;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedBrandSearch(brandSearch.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [brandSearch]);

  const handleBrandDropdownOpenChange = (nextOpen: boolean) => {
    setBrandDropdownOpen(nextOpen);
    if (!nextOpen) {
      setBrandSearch('');
      setDebouncedBrandSearch('');
    }
  };

  return (
    <FormSection
      title={t('pages.products.dialog.sections.details')}
      icon={ClipboardList}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <FieldLabel htmlFor='product-sku' required>
            {t('pages.products.fields.sku')}
          </FieldLabel>
          <Input id='product-sku' {...register('sku')} maxLength={100} />
          <ValidationMessage messageKey={errors.sku?.message} />
        </div>
        <div>
          <FieldLabel htmlFor='product-name' required>
            {t('pages.products.fields.name')}
          </FieldLabel>
          <Input id='product-name' {...register('name')} maxLength={255} />
          <ValidationMessage messageKey={errors.name?.message} />
        </div>
        <div>
          <FieldLabel htmlFor='product-ean'>
            {t('pages.products.fields.ean')}
          </FieldLabel>
          <Input id='product-ean' {...register('ean')} maxLength={20} />
          <ValidationMessage messageKey={errors.ean?.message} />
        </div>
        <div>
          <FieldLabel>{t('pages.products.fields.brand')}</FieldLabel>
          <Controller
            control={control}
            name='brandId'
            render={({ field }) => (
              <PopoverPrimitive.Root
                open={brandDropdownOpen}
                onOpenChange={handleBrandDropdownOpenChange}
              >
                <PopoverPrimitive.Trigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    role='combobox'
                    aria-label={t('pages.products.fields.brand')}
                    aria-expanded={brandDropdownOpen}
                    className={`${productSelectTriggerClassName} justify-between hover:text-white focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/50`}
                  >
                    <span className='truncate'>
                      {brands.find((brand) => String(brand.id) === field.value)
                        ?.name ?? t('pages.products.fields.no-brand')}
                    </span>
                    <ChevronDown className='h-4 w-4 shrink-0 opacity-60' />
                  </Button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    align='start'
                    side='bottom'
                    sideOffset={4}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    className='z-[100] w-[var(--radix-popover-trigger-width)] rounded-md border border-zinc-700 bg-zinc-800 p-2 text-zinc-100 shadow-lg'
                  >
                    <Input
                      name='brand-search'
                      autoFocus
                      value={brandSearch}
                      onChange={(event) => setBrandSearch(event.target.value)}
                      placeholder={t('pages.products.fields.search-brands')}
                      aria-label={t('pages.products.fields.search-brands')}
                      className='mb-2'
                    />
                    <div role='listbox' className='max-h-48 overflow-y-auto'>
                      <button
                        type='button'
                        role='option'
                        aria-selected={!field.value}
                        className='flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-zinc-700'
                        onClick={() => {
                          field.onChange('');
                          handleBrandDropdownOpenChange(false);
                        }}
                      >
                        {t('pages.products.fields.no-brand')}
                        {!field.value && <Check className='h-4 w-4' />}
                      </button>
                      {brands.map((brand) => (
                        <button
                          key={brand.id}
                          type='button'
                          role='option'
                          aria-selected={field.value === String(brand.id)}
                          className='flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-zinc-700'
                          onClick={() => {
                            field.onChange(String(brand.id));
                            handleBrandDropdownOpenChange(false);
                          }}
                        >
                          {brand.name}
                          {field.value === String(brand.id) && (
                            <Check className='h-4 w-4' />
                          )}
                        </button>
                      ))}
                      {brandsQuery.isPending && (
                        <p className='px-2 py-2 text-sm text-zinc-400'>
                          {t('pages.products.loading-brands')}
                        </p>
                      )}
                      {!brandsQuery.isPending &&
                        debouncedBrandSearch.length > 0 &&
                        brands.length === 0 && (
                          <p className='px-2 py-2 text-sm text-zinc-400'>
                            {t('pages.products.no-brands-found')}
                          </p>
                        )}
                    </div>
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
            )}
          />
          <ValidationMessage messageKey={errors.brandId?.message} />
        </div>
        {editing && (
          <div>
            <FieldLabel>{t('pages.products.fields.status')}</FieldLabel>
            <Controller
              control={control}
              name='status'
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    aria-label={t('pages.products.fields.status')}
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
                    {[
                      ProductStatus.ACTIVE,
                      ProductStatus.DRAFT,
                      ProductStatus.DISCONTINUED,
                    ].map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`pages.products.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
        <div className='sm:col-span-2'>
          <FieldLabel htmlFor='product-description'>
            {t('pages.products.fields.description')}
          </FieldLabel>
          <textarea
            id='product-description'
            {...register('description')}
            rows={3}
            className='w-full rounded-md border border-zinc-500 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
        </div>
      </div>
    </FormSection>
  );
}
