'use client';

import { Badge } from '@/features/shared/components/ui/badge';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import type { Currency } from '@/features/settings/types/currencyDtos';
import type { ProductResponse } from '@/features/products/types/product';
import {
  type ColumnDef,
  type HeaderContext,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

const sortableLabels: Record<string, string> = {
  sku: 'pages.products.table.sku',
  name: 'pages.products.table.name',
  brand: 'pages.products.table.brand',
  netPrice: 'pages.products.table.net-price',
  status: 'pages.products.table.status',
};

function ProductSortableHeader({
  column,
}: HeaderContext<ProductResponse, unknown>) {
  const t = useTranslations();
  const label = sortableLabels[column.id];

  if (!label) return null;

  return (
    <button
      type='button'
      onClick={column.getToggleSortingHandler()}
      className='inline-flex items-center gap-2 font-medium'
    >
      {t(label)}
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp className='h-3.5 w-3.5' />
      ) : column.getIsSorted() === 'desc' ? (
        <ArrowDown className='h-3.5 w-3.5' />
      ) : (
        <ArrowUpDown className='h-3.5 w-3.5 opacity-60' />
      )}
    </button>
  );
}

export function useProductsColumns(currencies: Currency[]): ColumnDef<ProductResponse>[] {
  const t = useTranslations();
  const locale = useLocale();

  return useMemo(() => {
    const currenciesById = new Map(currencies.map((currency) => [currency.id, currency]));

    return [
      {
        id: 'select',
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
            aria-label={t('common.select-row')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      { accessorKey: 'sku', header: ProductSortableHeader },
      { accessorKey: 'name', header: ProductSortableHeader },
      {
        accessorKey: 'brand',
        header: ProductSortableHeader,
        cell: ({ row }) => row.original.brand?.name ?? '—',
      },
      {
        id: 'unit',
        header: t('pages.products.table.unit'),
        enableSorting: false,
        cell: ({ row }) => {
          const { main, secondary } = row.original.units;
          return secondary
            ? `${main.symbol} / ${secondary.symbol}`
            : main.symbol || main.name;
        },
      },
      {
        id: 'netPrice',
        accessorFn: (row) => row.pricing.netPrice,
        header: ProductSortableHeader,
        cell: ({ row }) => {
          const { currencyId, netPrice } = row.original.pricing;
          const currency = currencyId ? currenciesById.get(currencyId) : undefined;
          if (!currency) return new Intl.NumberFormat(locale).format(netPrice);

          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency.code,
          }).format(netPrice);
        },
      },
      {
        accessorKey: 'status',
        header: ProductSortableHeader,
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}
          >
            {t(`pages.products.status.${row.original.status}`)}
          </Badge>
        ),
      },
    ];
  }, [currencies, locale, t]);
}
