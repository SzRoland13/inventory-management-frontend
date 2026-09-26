'use client';

import { Badge } from '@/features/shared/components/ui/badge';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { ProductStatus } from '@/features/products/types/product';
import type { ProductTableRow } from '@/features/products/types/product';
import {
  type ColumnDef,
  type HeaderContext,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

function ProductSortableHeader({
  column,
}: HeaderContext<ProductTableRow, unknown>) {
  const t = useTranslations();
  const labels: Record<string, string> = {
    sku: 'pages.products.table.sku',
    name: 'pages.products.table.name',
    brand: 'pages.products.table.brand',
    unit: 'pages.products.table.unit',
    netPrice: 'pages.products.table.net-price',
    status: 'pages.products.table.status',
  };

  return (
    <button
      type='button'
      onClick={column.getToggleSortingHandler()}
      className='inline-flex items-center gap-2 font-medium'
    >
      {t(labels[column.id])}
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

export function useProductsColumns(): ColumnDef<ProductTableRow>[] {
  const t = useTranslations();

  return useMemo<ColumnDef<ProductTableRow>[]>(() => [
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
      cell: ({ getValue }) => getValue<string | null>() || '—',
    },
    { accessorKey: 'unit', header: ProductSortableHeader },
    {
      accessorKey: 'netPrice',
      header: ProductSortableHeader,
      cell: ({ row }) =>
        new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: row.original.currency,
        }).format(row.original.netPrice),
    },
    {
      accessorKey: 'status',
      header: ProductSortableHeader,
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === ProductStatus.ACTIVE
              ? 'default'
              : 'secondary'
          }
        >
          {t(`pages.products.status.${row.original.status}`)}
        </Badge>
      ),
    },
  ], [t]);
}
