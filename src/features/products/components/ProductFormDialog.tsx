'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { Input } from '@/features/shared/components/ui/input';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { ValidationMessage } from '@/features/shared/components/ValidationMessage';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/features/shared/components/ui/tooltip';
import { useBrandsQuery } from '@/features/brands/queries/brandQueries';
import {
  BadgeDollarSign,
  Boxes,
  Check,
  ChevronDown,
  ClipboardList,
  Ruler,
  SlidersHorizontal,
  Tags,
} from 'lucide-react';
import {
  createProductFormSchema,
  productFormToRequest,
  type ProductFormValues,
} from '@/features/products/schemas/productSchemas';
import {
  ProductAttributeValueType,
  ProductStatus,
  type ProductAttributeDefinition,
  type ProductCategory,
  type ProductRequest,
  type ProductResponse,
  type ProductUnit,
} from '@/features/products/types/product';
import type { Currency } from '@/features/settings/types/currencyDtos';

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

function valuesFromProduct(
  product: ProductResponse | undefined,
  definitions: ProductAttributeDefinition[],
): ProductFormValues {
  const attributes = new Map(
    (product?.attributes ?? []).map((attribute) => [
      attribute.definitionId,
      attribute,
    ]),
  );

  return {
    sku: product?.sku ?? '',
    ean: product?.ean ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    brandId: product?.brand ? String(product.brand.id) : '',
    status:
      product?.status === ProductStatus.ARCHIVED
        ? ProductStatus.ACTIVE
        : (product?.status ?? ProductStatus.ACTIVE),
    mainUnitId: product ? String(product.units.main.id) : '',
    secondaryUnitId: product?.units.secondary
      ? String(product.units.secondary.id)
      : '',
    secondaryUnitsPerMainUnit:
      product?.units.secondaryUnitsPerMainUnit == null
        ? ''
        : String(product.units.secondaryUnitsPerMainUnit),
    currencyId:
      product?.pricing.currencyId == null
        ? ''
        : String(product.pricing.currencyId),
    netPrice: product ? String(product.pricing.netPrice) : '',
    costPrice:
      product?.pricing.costPrice == null
        ? ''
        : String(product.pricing.costPrice),
    vatRate: product ? String(product.pricing.vatRate) : '',
    weight:
      product?.dimensions.weight == null
        ? ''
        : String(product.dimensions.weight),
    width:
      product?.dimensions.width == null ? '' : String(product.dimensions.width),
    height:
      product?.dimensions.height == null
        ? ''
        : String(product.dimensions.height),
    depth:
      product?.dimensions.depth == null ? '' : String(product.dimensions.depth),
    categoryIds: (product?.categoryIds ?? []).map(String),
    attributes: definitions.map((definition) => {
      const attribute = attributes.get(definition.id);
      let value = '';
      switch (definition.valueType) {
        case ProductAttributeValueType.FIXED:
          value = attribute?.optionId == null ? '' : String(attribute.optionId);
          break;
        case ProductAttributeValueType.NUMBER:
          value =
            attribute?.numberValue == null ? '' : String(attribute.numberValue);
          break;
        case ProductAttributeValueType.DATE:
          value = attribute?.dateValue ?? '';
          break;
        case ProductAttributeValueType.TEXT:
          value = attribute?.textValue ?? '';
          break;
        case ProductAttributeValueType.BOOLEAN:
          value =
            attribute?.booleanValue == null
              ? ''
              : String(attribute.booleanValue);
          break;
      }
      return { definitionId: definition.id, value };
    }),
  };
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className='mb-1 block text-sm font-medium text-zinc-200'>
      {children}
      {required && <span className='ml-1 text-red-400'>*</span>}
    </span>
  );
}

const productSelectTriggerClassName =
  'w-full border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80 data-[placeholder]:text-zinc-300 [&_svg]:text-zinc-300';
const numberInputClassName =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function FormSection({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: typeof Boxes;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-700/80 bg-zinc-800/50 p-4 sm:p-5 ${className}`}
    >
      <h3 className='mb-4 flex items-center gap-2.5 text-sm font-semibold text-zinc-100'>
        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700/70 text-zinc-300'>
          <Icon className='h-4 w-4' />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
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

  const submit = (status?: ProductRequest['status']) =>
    handleSubmit(async (values) => {
      const request = productFormToRequest(values, definitions);
      await onSave(request, editing ? request.status : status);
    })();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleBrandDropdownOpenChange(false);
        onOpenChange(nextOpen);
      }}
    >
      <ThemedDialogContent className='!w-[96vw] !max-w-[88rem] flex max-h-[92dvh] flex-col gap-0 overflow-hidden border-zinc-700 bg-zinc-900 p-0 shadow-black/50'>
        <DialogHeader className='shrink-0 border-b border-zinc-700/80 bg-zinc-900 px-6 py-5 pr-14 sm:px-8'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300'>
              <Boxes className='h-5 w-5' />
            </span>
            <DialogTitle className='text-xl tracking-tight'>
              {editing
                ? t('pages.products.dialog.edit-title')
                : t('pages.products.dialog.create-title')}
            </DialogTitle>
          </div>
          <DialogDescription className='sr-only'>
            {t(
              editing
                ? 'pages.products.dialog.edit-description'
                : 'pages.products.dialog.create-description',
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingProduct ? (
          <p className='py-16 text-center text-zinc-300'>
            {t('pages.products.loading')}
          </p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit(editing ? undefined : ProductStatus.DRAFT);
            }}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='min-h-0 flex-1 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 py-5 sm:px-8'>
              <FormSection
                title={t('pages.products.dialog.sections.details')}
                icon={ClipboardList}
              >
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label>
                    <FieldLabel required>
                      {t('pages.products.fields.sku')}
                    </FieldLabel>
                    <Input {...register('sku')} maxLength={100} />
                    <ValidationMessage messageKey={errors.sku?.message} />
                  </label>
                  <label>
                    <FieldLabel required>
                      {t('pages.products.fields.name')}
                    </FieldLabel>
                    <Input {...register('name')} maxLength={255} />
                    <ValidationMessage messageKey={errors.name?.message} />
                  </label>
                  <label>
                    <FieldLabel>{t('pages.products.fields.ean')}</FieldLabel>
                    <Input {...register('ean')} maxLength={20} />
                    <ValidationMessage messageKey={errors.ean?.message} />
                  </label>
                  <label>
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
                              aria-expanded={brandDropdownOpen}
                              className={`${productSelectTriggerClassName} justify-between hover:text-white focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/50`}
                            >
                              <span className='truncate'>
                                {brands.find(
                                  (brand) => String(brand.id) === field.value,
                                )?.name ?? t('pages.products.fields.no-brand')}
                              </span>
                              <ChevronDown className='h-4 w-4 shrink-0 opacity-60' />
                            </Button>
                          </PopoverPrimitive.Trigger>
                          <PopoverPrimitive.Portal>
                            <PopoverPrimitive.Content
                              align='start'
                              side='bottom'
                              sideOffset={4}
                              onOpenAutoFocus={(event) =>
                                event.preventDefault()
                              }
                              className='z-[100] w-[var(--radix-popover-trigger-width)] rounded-md border border-zinc-700 bg-zinc-800 p-2 text-zinc-100 shadow-lg'
                            >
                              <Input
                                autoFocus
                                value={brandSearch}
                                onChange={(event) =>
                                  setBrandSearch(event.target.value)
                                }
                                placeholder={t(
                                  'pages.products.fields.search-brands',
                                )}
                                aria-label={t(
                                  'pages.products.fields.search-brands',
                                )}
                                className='mb-2'
                              />
                              <div
                                role='listbox'
                                className='max-h-48 overflow-y-auto'
                              >
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
                                  {!field.value && (
                                    <Check className='h-4 w-4' />
                                  )}
                                </button>
                                {brands.map((brand) => (
                                  <button
                                    key={brand.id}
                                    type='button'
                                    role='option'
                                    aria-selected={
                                      field.value === String(brand.id)
                                    }
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
                  </label>
                  {editing && (
                    <label>
                      <FieldLabel>
                        {t('pages.products.fields.status')}
                      </FieldLabel>
                      <Controller
                        control={control}
                        name='status'
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
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
                    </label>
                  )}
                  <label className='sm:col-span-2'>
                    <FieldLabel>
                      {t('pages.products.fields.description')}
                    </FieldLabel>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className='w-full rounded-md border border-zinc-500 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    />
                  </label>
                </div>
              </FormSection>

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
                      <label>
                        <FieldLabel required>
                          {t('pages.products.fields.main-unit')}
                        </FieldLabel>
                        <Controller
                          control={control}
                          name='mainUnitId'
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={productSelectTriggerClassName}
                              >
                                <SelectValue
                                  placeholder={t(
                                    'pages.products.fields.select-unit',
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent
                                position='popper'
                                side='bottom'
                                avoidCollisions={false}
                                className='border-zinc-700 bg-zinc-800 text-zinc-100'
                              >
                                {units.map((unit) => (
                                  <SelectItem
                                    key={unit.id}
                                    value={String(unit.id)}
                                  >
                                    {unit.name} ({unit.symbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <ValidationMessage
                          messageKey={errors.mainUnitId?.message}
                        />
                      </label>
                      <label>
                        <FieldLabel>
                          {t('pages.products.fields.secondary-unit')}
                        </FieldLabel>
                        <Controller
                          control={control}
                          name='secondaryUnitId'
                          render={({ field }) => (
                            <Select
                              value={field.value || 'NONE'}
                              onValueChange={(value) =>
                                field.onChange(value === 'NONE' ? '' : value)
                              }
                            >
                              <SelectTrigger
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
                                  <SelectItem
                                    key={unit.id}
                                    value={String(unit.id)}
                                  >
                                    {unit.name} ({unit.symbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <ValidationMessage
                          messageKey={errors.secondaryUnitId?.message}
                        />
                      </label>
                      <label>
                        <FieldLabel>
                          {t('pages.products.fields.secondary-units-per-main')}
                        </FieldLabel>
                        <Input
                          {...register('secondaryUnitsPerMainUnit')}
                          className={numberInputClassName}
                          type='number'
                          min='0'
                          step='any'
                        />
                        <ValidationMessage
                          messageKey={errors.secondaryUnitsPerMainUnit?.message}
                        />
                      </label>
                    </div>
                  </div>
                  <div className='rounded-lg border border-zinc-700/70 bg-zinc-900/60 p-4'>
                    <h4 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400'>
                      {t('pages.products.dialog.groups.pricing')}
                    </h4>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <label>
                        <FieldLabel>
                          {t('pages.products.fields.currency')}
                        </FieldLabel>
                        <Controller
                          control={control}
                          name='currencyId'
                          render={({ field }) => (
                            <Select
                              value={field.value || 'NONE'}
                              onValueChange={(value) =>
                                field.onChange(value === 'NONE' ? '' : value)
                              }
                            >
                              <SelectTrigger
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
                        <ValidationMessage
                          messageKey={errors.currencyId?.message}
                        />
                      </label>
                      <label>
                        <FieldLabel required>
                          {t('pages.products.fields.net-price')}
                        </FieldLabel>
                        <Input
                          {...register('netPrice')}
                          className={numberInputClassName}
                          type='number'
                          min='0'
                          step='any'
                        />
                        <ValidationMessage
                          messageKey={errors.netPrice?.message}
                        />
                      </label>
                      <label>
                        <FieldLabel>
                          {t('pages.products.fields.cost-price')}
                        </FieldLabel>
                        <Input
                          {...register('costPrice')}
                          className={numberInputClassName}
                          type='number'
                          min='0'
                          step='any'
                        />
                        <ValidationMessage
                          messageKey={errors.costPrice?.message}
                        />
                      </label>
                      <label>
                        <FieldLabel required>
                          {t('pages.products.fields.vat-rate')}
                        </FieldLabel>
                        <Input
                          {...register('vatRate')}
                          className={numberInputClassName}
                          type='number'
                          min='0'
                          max='99.999'
                          step='any'
                        />
                        <ValidationMessage
                          messageKey={errors.vatRate?.message}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title={t('pages.products.dialog.sections.dimensions')}
                icon={Ruler}
              >
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  {(['weight', 'width', 'height', 'depth'] as const).map(
                    (fieldName) => (
                      <label key={fieldName}>
                        <FieldLabel>
                          {t(`pages.products.fields.${fieldName}`)}
                        </FieldLabel>
                        <Input
                          {...register(fieldName)}
                          className={numberInputClassName}
                          type='number'
                          min='0'
                          step='any'
                        />
                        <ValidationMessage
                          messageKey={errors[fieldName]?.message}
                        />
                      </label>
                    ),
                  )}
                </div>
              </FormSection>

              {categories.length > 0 && (
                <FormSection
                  title={t('pages.products.dialog.sections.categories')}
                  icon={Tags}
                >
                  <Controller
                    control={control}
                    name='categoryIds'
                    render={({ field }) => (
                      <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                        {categories.map((category) => {
                          const value = String(category.id);
                          const checked = field.value.includes(value);
                          return (
                            <label
                              key={category.id}
                              className='flex items-center gap-2 text-sm'
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  field.onChange(
                                    nextChecked
                                      ? [...field.value, value]
                                      : field.value.filter(
                                          (item) => item !== value,
                                        ),
                                  )
                                }
                              />
                              {category.name}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                </FormSection>
              )}

              {definitions.length > 0 && (
                <FormSection
                  title={t('pages.products.dialog.sections.attributes')}
                  icon={SlidersHorizontal}
                >
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {definitions.map((definition, index) => (
                      <label key={definition.id}>
                        <FieldLabel required={definition.required}>
                          {definition.name}
                        </FieldLabel>
                        <Controller
                          control={control}
                          name={`attributes.${index}.value`}
                          render={({ field }) => {
                            if (
                              definition.valueType ===
                              ProductAttributeValueType.FIXED
                            ) {
                              return (
                                <Select
                                  value={field.value || 'NONE'}
                                  onValueChange={(value) =>
                                    field.onChange(
                                      value === 'NONE' ? '' : value,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={productSelectTriggerClassName}
                                  >
                                    <SelectValue
                                      placeholder={t(
                                        'pages.products.fields.select-value',
                                      )}
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
                                      <SelectItem
                                        key={option.id}
                                        value={String(option.id)}
                                      >
                                        {option.value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            }
                            if (
                              definition.valueType ===
                              ProductAttributeValueType.BOOLEAN
                            ) {
                              return (
                                <Select
                                  value={field.value || 'NONE'}
                                  onValueChange={(value) =>
                                    field.onChange(
                                      value === 'NONE' ? '' : value,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={productSelectTriggerClassName}
                                  >
                                    <SelectValue
                                      placeholder={t(
                                        'pages.products.fields.select-value',
                                      )}
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
                                    <SelectItem value='true'>
                                      {t('common.yes')}
                                    </SelectItem>
                                    <SelectItem value='false'>
                                      {t('common.no')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              );
                            }
                            return (
                              <Input
                                {...field}
                                value={field.value}
                                type={
                                  definition.valueType ===
                                  ProductAttributeValueType.DATE
                                    ? 'date'
                                    : definition.valueType ===
                                        ProductAttributeValueType.NUMBER
                                      ? 'number'
                                      : 'text'
                                }
                                className={
                                  definition.valueType ===
                                  ProductAttributeValueType.NUMBER
                                    ? numberInputClassName
                                    : undefined
                                }
                                step={
                                  definition.valueType ===
                                  ProductAttributeValueType.NUMBER
                                    ? 'any'
                                    : undefined
                                }
                              />
                            );
                          }}
                        />
                        <ValidationMessage
                          messageKey={
                            errors.attributes?.[index]?.value?.message
                          }
                        />
                      </label>
                    ))}
                  </div>
                </FormSection>
              )}
            </div>

            <DialogFooter className='shrink-0 border-t border-zinc-700/80 bg-zinc-900 px-6 py-4 sm:px-8'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white'
                    onClick={() => onOpenChange(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('pages.products.dialog.tooltips.cancel')}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    className='bg-indigo-500 text-white hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:opacity-100'
                    disabled={saving || isSubmitting}
                    onClick={() =>
                      void submit(editing ? undefined : ProductStatus.DRAFT)
                    }
                  >
                    {saving || isSubmitting
                      ? t('common.saving')
                      : t('common.save')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(
                    `pages.products.dialog.tooltips.${editing ? 'save-edit' : 'save-draft'}`,
                  )}
                </TooltipContent>
              </Tooltip>
              {!editing && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      className='bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:opacity-100'
                      disabled={saving || isSubmitting}
                      onClick={() => void submit(ProductStatus.ACTIVE)}
                    >
                      {saving || isSubmitting
                        ? t('common.saving')
                        : t('pages.products.actions.publish')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('pages.products.dialog.tooltips.publish')}
                  </TooltipContent>
                </Tooltip>
              )}
            </DialogFooter>
          </form>
        )}
      </ThemedDialogContent>
    </Dialog>
  );
}
