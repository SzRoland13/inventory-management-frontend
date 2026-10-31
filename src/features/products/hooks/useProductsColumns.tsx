'use client';

import { Badge } from '@/features/shared/components/ui/badge';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import type { Currency } from '@/features/settings/types/currencyDtos';
import type {
  ProductAttributeDefinition,
  ProductCategory,
  ProductResponse,
} from '@/features/products/types/product';
import { ProductStockCell } from '@/features/products/components/ProductStockCell';
import { ProductImagePreview } from '@/features/products/components/ProductImagePreview';
import { getPrimaryProductImage } from '@/features/products/helpers/productImages';
import {
  type CellContext,
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
  stock: 'pages.products.table.stock',
};

function formatNumber(value: number | null, locale: string) {
  return value === null ? '—' : new Intl.NumberFormat(locale).format(value);
}

function getAttributeValue(
  value: ProductResponse['attributes'][number],
  yesLabel: string,
  noLabel: string,
) {
  if (value.optionValue !== null) return value.optionValue;
  if (value.textValue !== null) return value.textValue;
  if (value.numberValue !== null) return String(value.numberValue);
  if (value.dateValue !== null) return value.dateValue;
  if (value.booleanValue !== null)
    return value.booleanValue ? yesLabel : noLabel;
  return '—';
}

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

export function useProductsColumns(
  currencies: Currency[],
  categories: ProductCategory[],
  attributeDefinitions: ProductAttributeDefinition[],
): ColumnDef<ProductResponse>[] {
  const t = useTranslations();
  const locale = useLocale();

  return useMemo(() => {
    const currenciesById = new Map(
      currencies.map((currency) => [currency.id, currency]),
    );
    const categoriesById = new Map(
      categories.map((category) => [category.id, category.name]),
    );
    const formatPrice = (currencyId: number | null, value: number | null) => {
      if (value === null) return '—';
      const currency = currencyId ? currenciesById.get(currencyId) : undefined;
      return new Intl.NumberFormat(
        locale,
        currency ? { style: 'currency', currency: currency.code } : undefined,
      ).format(value);
    };

    return [
      {
        accessorKey: 'sku',
        enableHiding: false,
        header: ProductSortableHeader,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(checked) => row.toggleSelected(!!checked)}
              aria-label={t('common.select-row')}
            />
            <ProductImagePreview
              mediaAssetId={getPrimaryProductImage(row.original.images)?.mediaAssetId ?? null}
              alt={t('pages.products.images.thumbnail-alt', {
                product: row.original.name,
              })}
              className='h-9 w-9'
            />
            <span>{row.original.sku}</span>
          </div>
        ),
      },
      { accessorKey: 'name', header: ProductSortableHeader },
      {
        accessorKey: 'brand',
        header: ProductSortableHeader,
        cell: ({ row }) => row.original.brand?.name ?? '—',
      },
      {
        id: 'mainUnit',
        header: t('pages.products.table.mainUnit'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.units.main.symbol || row.original.units.main.name,
      },
      {
        id: 'secondaryUnit',
        header: t('pages.products.table.secondaryUnit'),
        enableSorting: false,
        cell: ({ row }) => {
          const unit = row.original.units.secondary;
          return unit ? unit.symbol || unit.name : '—';
        },
      },
      {
        id: 'netPrice',
        accessorFn: (row) => row.pricing.netPrice,
        header: ProductSortableHeader,
        cell: ({ row }) => {
          const { currencyId, netPrice } = row.original.pricing;
          return formatPrice(currencyId, netPrice);
        },
      },
      {
        id: 'grossPrice',
        header: t('pages.products.table.grossPrice'),
        enableSorting: false,
        cell: ({ row }) => {
          const { currencyId, netPrice, vatRate } = row.original.pricing;
          return formatPrice(currencyId, netPrice * (1 + vatRate / 100));
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
      {
        id: 'stock',
        header: t('pages.products.table.stock'),
        enableSorting: false,
        cell: ({ row }) => <ProductStockCell product={row.original} />,
      },
      {
        accessorKey: 'ean',
        header: t('pages.products.table.ean'),
        cell: ({ row }) => row.original.ean ?? '—',
      },
      {
        accessorKey: 'description',
        header: t('pages.products.table.description'),
        cell: ({ row }) => row.original.description ?? '—',
      },
      {
        id: 'costPrice',
        header: t('pages.products.table.costPrice'),
        cell: ({ row }) =>
          formatPrice(row.original.pricing.currencyId, row.original.pricing.costPrice),
      },
      {
        id: 'secondaryNetPrice',
        header: t('pages.products.table.secondaryNetPrice'),
        cell: ({ row }) =>
          formatPrice(
            row.original.pricing.currencyId,
            row.original.pricing.secondaryNetPrice,
          ),
      },
      {
        id: 'vatRate',
        header: t('pages.products.table.vatRate'),
        cell: ({ row }) => `${formatNumber(row.original.pricing.vatRate, locale)}%`,
      },
      ...(['weight', 'width', 'height', 'depth'] as const).map((dimension) => ({
        id: dimension,
        header: t(`pages.products.table.${dimension}`),
        cell: ({ row }: { row: { original: ProductResponse } }) =>
          formatNumber(row.original.dimensions[dimension], locale),
      })),
      {
        id: 'categories',
        header: t('pages.products.table.categories'),
        cell: ({ row }) =>
          row.original.categoryIds
            .map((id) => categoriesById.get(id))
            .filter((name): name is string => !!name)
            .join(', ') || '—',
      },
      ...attributeDefinitions.map((definition) => ({
        id: `attribute-${definition.id}`,
        header: definition.name,
        enableSorting: false,
        meta: { label: definition.name, isProductAttribute: true },
        accessorFn: (product: ProductResponse) =>
          product.attributes.find(
            (attribute) => attribute.definitionId === definition.id,
          ),
        cell: ({ getValue }: CellContext<ProductResponse, unknown>) => {
          const attribute = getValue() as
            | ProductResponse['attributes'][number]
            | undefined;
          return attribute
            ? getAttributeValue(attribute, t('common.yes'), t('common.no'))
            : '—';
        },
      })),
      {
        id: 'createdAt',
        header: t('pages.products.table.createdAt'),
        cell: ({ row }) =>
          new Intl.DateTimeFormat(locale).format(
            new Date(row.original.createdAt),
          ),
      },
      {
        id: 'updatedAt',
        header: t('pages.products.table.updatedAt'),
        cell: ({ row }) =>
          new Intl.DateTimeFormat(locale).format(
            new Date(row.original.updatedAt),
          ),
      },
    ];
  }, [attributeDefinitions, categories, currencies, locale, t]);
}
