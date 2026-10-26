'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/features/shared/types/routes';
import {
  StockDateRangeFilter,
  StockProductFilter,
  StockWarehouseFilter,
} from '@/features/stocks/components/StockFilters';
import { StockTablePanel } from '@/features/stocks/components/StockTablePanel';
import { useStockMovementsQuery } from '@/features/stocks/queries/stockQueries';
import {
  formatStockDate,
  formatStockQuantity,
} from '@/features/stocks/helpers/stockFormatters';
import type {
  StockMovement,
  StockMovementRequest,
} from '@/features/stocks/types/stock';

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 25 };
const EMPTY_MOVEMENTS: StockMovement[] = [];

export function StockMovementsTable({
  enabled,
  productId,
  onProductIdChange,
}: {
  enabled: boolean;
  productId: string;
  onProductIdChange: (productId: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [warehouseId, setWarehouseId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const request = useMemo<StockMovementRequest>(
    () => ({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      productId: productId === 'ALL' ? undefined : Number(productId),
      warehouseId: warehouseId === 'ALL' ? undefined : Number(warehouseId),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [pagination, productId, warehouseId, startDate, endDate],
  );
  const movementsQuery = useStockMovementsQuery(request, enabled);
  const movements = movementsQuery.data?.payload.content ?? EMPTY_MOVEMENTS;
  const page = movementsQuery.data?.payload.page;

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('pages.stocks.columns.date'),
        cell: ({ row }) => formatStockDate(row.original.date, locale),
      },
      {
        accessorKey: 'productName',
        header: t('pages.stocks.columns.product'),
        cell: ({ row }) => (
          <Link
            href={`${Routes.Products}/${row.original.productId}?from=stocks&view=movements&productId=${row.original.productId}`}
            className='group block min-w-0'
          >
            <div className='font-medium text-zinc-100'>
              {row.original.productName}
            </div>
            <div className='text-xs text-zinc-400 group-hover:text-sky-300'>
              {row.original.productSku}
            </div>
          </Link>
        ),
      },
      {
        accessorKey: 'warehouseName',
        header: t('pages.stocks.columns.warehouse'),
      },
      {
        id: 'quantityChange',
        header: () => (
          <div className='w-full text-right'>
            {t('pages.stocks.columns.change')}
          </div>
        ),
        cell: ({ row }) => (
          <div
            className={`w-full text-right tabular-nums ${row.original.quantityChange < 0 ? 'text-rose-300' : 'text-emerald-300'}`}
          >
            {formatStockQuantity(
              row.original.quantityChange,
              row.original.unit.symbol,
              locale,
            )}
            {row.original.secondaryUnit &&
              row.original.secondaryQuantityChange !== null && (
                <div className='text-xs text-zinc-400'>
                  {formatStockQuantity(
                    row.original.secondaryQuantityChange,
                    row.original.secondaryUnit.symbol,
                    locale,
                  )}
                </div>
              )}
          </div>
        ),
      },
      {
        accessorKey: 'movementType',
        header: t('pages.stocks.columns.type'),
        cell: ({ row }) =>
          t(`pages.stocks.movement-types.${row.original.movementType}`),
      },
      {
        id: 'document',
        header: t('pages.stocks.columns.document'),
        cell: ({ row }) =>
          row.original.documentId === null ? (
            t('common.none')
          ) : (
            <Link
              className='text-sky-300 underline-offset-4 hover:underline'
              href={{
                pathname: Routes.Documents,
                query: { documentId: String(row.original.documentId) },
              }}
            >
              {row.original.documentNumber ?? `#${row.original.documentId}`}
            </Link>
          ),
      },
    ],
    [locale, t],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: movements,
    columns,
    state: { pagination },
    manualPagination: true,
    pageCount: page?.totalPages ?? 0,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  function updateFilter(update: () => void) {
    update();
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  return (
    <section>
      <div className='flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 p-3'>
        <StockProductFilter
          value={productId}
          onChange={(value) => updateFilter(() => onProductIdChange(value))}
        />
        <StockWarehouseFilter
          value={warehouseId}
          onChange={(value) => updateFilter(() => setWarehouseId(value))}
        />
        <StockDateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(value) =>
            updateFilter(() => setStartDate(value))
          }
          onEndDateChange={(value) => updateFilter(() => setEndDate(value))}
        />
      </div>
      <StockTablePanel
        table={table}
        isPending={movementsQuery.isPending}
        isError={movementsQuery.isError}
        totalRows={page?.totalElements ?? 0}
        pageCount={page?.totalPages ?? 0}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        loadingLabel={t('pages.stocks.loading-movements')}
        emptyLabel={t('pages.stocks.empty-movements')}
        onRetry={() => void movementsQuery.refetch()}
        onPageChange={(pageIndex) =>
          setPagination((current) => ({ ...current, pageIndex }))
        }
        onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
      />
    </section>
  );
}
