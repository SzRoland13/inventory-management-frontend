'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import {
  useProductQuery,
  useProductsQuery,
} from '@/features/products/queries/productQueries';
import { ProductSortField } from '@/features/products/types/product';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';

const PRODUCT_SEARCH_DELAY = 250;
const MIN_PRODUCT_SEARCH_LENGTH = 2;
const PRODUCT_LOOKUP_PAGE_SIZE = 10;
const FILTER_CLASS = 'border-zinc-600 bg-zinc-900 text-zinc-100';

interface StockProductFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function StockProductFilter({
  value,
  onChange,
}: StockProductFilterProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    sku: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      PRODUCT_SEARCH_DELAY,
    );

    return () => window.clearTimeout(timeout);
  }, [search]);

  const productRequest = useMemo(
    () => ({
      page: 0,
      size: PRODUCT_LOOKUP_PAGE_SIZE,
      search: debouncedSearch || undefined,
      sortBy: ProductSortField.NAME,
      sortDirection: 'ASC' as const,
    }),
    [debouncedSearch],
  );
  const canSearch = debouncedSearch.length >= MIN_PRODUCT_SEARCH_LENGTH;
  const productsQuery = useProductsQuery(productRequest, open && canSearch);
  const selectedProductQuery = useProductQuery(
    value === 'ALL' ? null : Number(value),
    value !== 'ALL' && selectedProduct?.id !== Number(value),
  );
  const products = productsQuery.data?.payload.content ?? [];
  const currentSelectedProduct =
    selectedProduct?.id === Number(value)
      ? selectedProduct
      : selectedProductQuery.data?.payload;
  const isSearching =
    canSearch &&
    (debouncedSearch !== search.trim() ||
      productsQuery.isPending ||
      productsQuery.isFetching);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        setSearch('');
        setDebouncedSearch('');
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label={t('pages.stocks.filters.product')}
          className={`w-full min-w-52 justify-between font-normal sm:w-64 ${FILTER_CLASS} hover:bg-zinc-800 hover:text-zinc-100`}
        >
          <span className='truncate'>
            {value !== 'ALL' && currentSelectedProduct
              ? `${currentSelectedProduct.sku} · ${currentSelectedProduct.name}`
              : value !== 'ALL'
                ? t('pages.stocks.filters.selected-product')
                : t('pages.stocks.filters.all-products')}
          </span>
          <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align='start'
          sideOffset={4}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className='z-[100] w-[var(--radix-popover-trigger-width)] min-w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-0 text-zinc-100 shadow-lg'
        >
          <div className='relative border-b border-zinc-700 p-2'>
            <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={200}
              placeholder={t('pages.stocks.product-search')}
              aria-label={t('pages.stocks.product-search')}
              className='border-zinc-700 bg-zinc-800 pl-8 text-zinc-100'
            />
          </div>
          <div
            id='stock-product-results'
            role='listbox'
            aria-label={t('pages.stocks.filters.product')}
            className='max-h-64 overflow-y-auto p-1'
          >
            <button
              type='button'
              role='option'
              aria-selected={value === 'ALL'}
              onClick={() => {
                setSelectedProduct(null);
                onChange('ALL');
                setOpen(false);
              }}
              className='flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-zinc-800 focus:bg-zinc-800'
            >
              <Check
                className={`h-4 w-4 shrink-0 ${value === 'ALL' ? 'opacity-100' : 'opacity-0'}`}
              />
              <span className='min-w-0 flex-1 truncate'>
                {t('pages.stocks.filters.all-products')}
              </span>
            </button>
            {!canSearch && (
              <p className='px-3 py-4 text-center text-sm text-zinc-400'>
                {t('pages.stocks.product-search-hint', {
                  minCharacters: MIN_PRODUCT_SEARCH_LENGTH,
                })}
              </p>
            )}
            {isSearching && (
              <p className='px-3 py-4 text-center text-sm text-zinc-400'>
                {t('pages.stocks.searching-products')}
              </p>
            )}
            {canSearch && !isSearching && productsQuery.isError && (
              <div className='px-3 py-4 text-center text-sm text-zinc-400'>
                <p>{t('pages.stocks.product-search-error')}</p>
                <button
                  type='button'
                  onClick={() => void productsQuery.refetch()}
                  className='mt-2 text-sky-300 underline'
                >
                  {t('common.retry')}
                </button>
              </div>
            )}
            {canSearch &&
              !isSearching &&
              !productsQuery.isError &&
              products.length === 0 && (
                <p className='px-3 py-4 text-center text-sm text-zinc-400'>
                  {t('pages.stocks.no-products-found')}
                </p>
              )}
            {canSearch &&
              !isSearching &&
              !productsQuery.isError &&
              products.map((product) => {
                const productOptionId = String(product.id);

                return (
                  <button
                    key={product.id}
                    type='button'
                    role='option'
                    aria-selected={value === productOptionId}
                    onClick={() => {
                      setSelectedProduct(product);
                      onChange(productOptionId);
                      setOpen(false);
                    }}
                    className='flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-zinc-800 focus:bg-zinc-800'
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 ${value === productOptionId ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <span className='min-w-0 flex-1 truncate'>
                      <span className='font-mono text-xs text-zinc-400'>
                        {product.sku}
                      </span>
                      <span className='px-1 text-zinc-500'>·</span>
                      {product.name}
                    </span>
                  </button>
                );
              })}
            {canSearch &&
              (productsQuery.data?.payload.page.totalElements ?? 0) >
                products.length && (
              <p className='px-3 py-2 text-center text-xs text-zinc-400'>
                {t('pages.stocks.product-search-more', {
                  count: products.length,
                })}
              </p>
                )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

interface StockWarehouseFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function StockWarehouseFilter({
  value,
  onChange,
}: StockWarehouseFilterProps) {
  const t = useTranslations();
  const warehousesQuery = useWarehousesQuery();
  const warehouses = warehousesQuery.data?.payload ?? [];

  useEffect(() => {
    if (warehousesQuery.error) toastApiError(t, warehousesQuery.error);
  }, [warehousesQuery.error, t]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={t('pages.stocks.filters.warehouse')}
        className={`min-w-40 ${FILTER_CLASS}`}
      >
        <SelectValue placeholder={t('pages.stocks.filters.warehouse')} />
      </SelectTrigger>
      <SelectContent
        position='popper'
        side='bottom'
        align='end'
        avoidCollisions={false}
        className='border-zinc-700 bg-zinc-800 text-zinc-100'
      >
        <SelectItem value='ALL'>
          {t('pages.stocks.filters.all-warehouses')}
        </SelectItem>
        {warehouses.map((warehouse) => (
          <SelectItem key={warehouse.id} value={String(warehouse.id)}>
            {warehouse.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface StockDateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function StockDateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: StockDateRangeFilterProps) {
  const t = useTranslations();

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <label className='flex items-center gap-2 text-sm text-zinc-300'>
        <span>{t('pages.stocks.filters.from')}</span>
        <Input
          type='date'
          value={startDate}
          max={endDate || undefined}
          onChange={(event) => onStartDateChange(event.target.value)}
          aria-label={t('pages.stocks.filters.from')}
          className={FILTER_CLASS}
        />
      </label>
      <label className='flex items-center gap-2 text-sm text-zinc-300'>
        <span>{t('pages.stocks.filters.to')}</span>
        <Input
          type='date'
          value={endDate}
          min={startDate || undefined}
          onChange={(event) => onEndDateChange(event.target.value)}
          aria-label={t('pages.stocks.filters.to')}
          className={FILTER_CLASS}
        />
      </label>
    </div>
  );
}
