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
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  const className = 'mb-1 block text-sm font-medium text-zinc-200';
  const label = (
    <>
      {children}
      {required && <span className='ml-1 text-red-400'>*</span>}
    </>
  );

  if (!htmlFor) {
    return <span className={className}>{label}</span>;
  }

  return (
    <label htmlFor={htmlFor} className={className}>
      {label}
    </label>
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

type CategoryTreeNode = {
  category: ProductCategory;
  children: CategoryTreeNode[];
};

function CategoryPicker({
  categories,
  selectedIds,
  onChange,
}: {
  categories: ProductCategory[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const t = useTranslations();
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const selected = new Set(selectedIds);

  const toggleCategory = (categoryId: number, checked: boolean) => {
    const value = String(categoryId);
    onChange(
      checked
        ? [...selectedIds, value]
        : selectedIds.filter((selectedId) => selectedId !== value),
    );
  };

  return (
    <div className='rounded-xl border border-zinc-700/80 bg-zinc-900/35 p-3 sm:p-4'>
      <div className='mb-3 flex items-center justify-between gap-3 px-1'>
        <p className='text-xs text-zinc-400'>
          {t('pages.products.dialog.category-picker.selected-count', {
            count: selectedIds.length,
          })}
        </p>
      </div>
      <div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
        {tree.map((node) => (
          <CategoryPickerNode
            key={node.category.id}
            node={node}
            depth={0}
            selected={selected}
            onToggle={toggleCategory}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryPickerNode({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: CategoryTreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (categoryId: number, checked: boolean) => void;
}) {
  const { category } = node;
  const checked = selected.has(String(category.id));

  return (
    <div>
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
          checked
            ? 'border-sky-400/40 bg-sky-400/[0.07]'
            : 'border-zinc-700/80 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
        }`}
      >
        <Checkbox
          name={`category-${category.id}`}
          checked={checked}
          onCheckedChange={(nextChecked) =>
            onToggle(category.id, nextChecked === true)
          }
          className='mt-0.5 border-zinc-500 data-[state=checked]:border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:text-zinc-950'
        />
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-medium leading-5 text-zinc-100'>
            {category.name}
          </span>
          <span className='mt-0.5 block truncate text-xs text-zinc-500'>
            {category.code}
            {category.description ? ` · ${category.description}` : ''}
          </span>
        </span>
      </label>
      {node.children.length > 0 && (
        <div
          className={`ml-4 mt-2 space-y-2 border-l border-zinc-700/80 pl-3 sm:ml-5 sm:pl-4 ${
            depth > 0 ? 'border-l-sky-400/20' : ''
          }`}
        >
          {node.children.map((child) => (
            <CategoryPickerNode
              key={child.category.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildCategoryTree(categories: ProductCategory[]): CategoryTreeNode[] {
  const nodes = new Map<number, CategoryTreeNode>(
    categories.map((category) => [category.id, { category, children: [] }]),
  );
  const roots: CategoryTreeNode[] = [];

  for (const node of nodes.values()) {
    const parent =
      node.category.parentId === null
        ? undefined
        : nodes.get(node.category.parentId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortTree = (siblings: CategoryTreeNode[]) => {
    siblings.sort(
      (a, b) =>
        (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0) ||
        a.category.name.localeCompare(b.category.name),
    );
    siblings.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);
  return roots;
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
                  <div>
                    <FieldLabel htmlFor='product-sku' required>
                      {t('pages.products.fields.sku')}
                    </FieldLabel>
                    <Input
                      id='product-sku'
                      {...register('sku')}
                      maxLength={100}
                    />
                    <ValidationMessage messageKey={errors.sku?.message} />
                  </div>
                  <div>
                    <FieldLabel htmlFor='product-name' required>
                      {t('pages.products.fields.name')}
                    </FieldLabel>
                    <Input
                      id='product-name'
                      {...register('name')}
                      maxLength={255}
                    />
                    <ValidationMessage messageKey={errors.name?.message} />
                  </div>
                  <div>
                    <FieldLabel htmlFor='product-ean'>
                      {t('pages.products.fields.ean')}
                    </FieldLabel>
                    <Input
                      id='product-ean'
                      {...register('ean')}
                      maxLength={20}
                    />
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
                                name='brand-search'
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
                  </div>
                  {editing && (
                    <div>
                      <FieldLabel>
                        {t('pages.products.fields.status')}
                      </FieldLabel>
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
                                aria-label={t(
                                  'pages.products.fields.main-unit',
                                )}
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
                                aria-label={t(
                                  'pages.products.fields.secondary-unit',
                                )}
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
                        <FieldLabel>
                          {t('pages.products.fields.currency')}
                        </FieldLabel>
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
                        <ValidationMessage
                          messageKey={errors.currencyId?.message}
                        />
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
                        <ValidationMessage
                          messageKey={errors.netPrice?.message}
                        />
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
                        <ValidationMessage
                          messageKey={errors.costPrice?.message}
                        />
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
                        <ValidationMessage
                          messageKey={errors.vatRate?.message}
                        />
                      </div>
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
                        <ValidationMessage
                          messageKey={errors[fieldName]?.message}
                        />
                      </div>
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
                      <CategoryPicker
                        categories={categories}
                        selectedIds={field.value}
                        onChange={field.onChange}
                      />
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
                      <div key={definition.id}>
                        <FieldLabel
                          htmlFor={
                            definition.valueType ===
                              ProductAttributeValueType.FIXED ||
                            definition.valueType ===
                              ProductAttributeValueType.BOOLEAN
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
                            if (
                              definition.valueType ===
                              ProductAttributeValueType.FIXED
                            ) {
                              return (
                                <Select
                                  name={field.name}
                                  value={field.value || 'NONE'}
                                  onValueChange={(value) =>
                                    field.onChange(
                                      value === 'NONE' ? '' : value,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    aria-label={definition.name}
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
                                  name={field.name}
                                  value={field.value || 'NONE'}
                                  onValueChange={(value) =>
                                    field.onChange(
                                      value === 'NONE' ? '' : value,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    aria-label={definition.name}
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
                                id={`product-attribute-${definition.id}`}
                                aria-label={definition.name}
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
                      </div>
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
