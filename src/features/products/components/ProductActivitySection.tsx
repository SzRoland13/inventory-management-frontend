'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table';
import { Activity } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/features/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/shared/components/ui/card';
import { DataTable } from '@/features/shared/table/DataTable';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { DataTablePagination } from '@/features/shared/table/DataTablePagination';
import { Routes } from '@/features/shared/types/routes';
import { useStockMovementsQuery } from '@/features/stocks/queries/stockQueries';
import {
  formatStockDate,
  formatStockQuantity,
} from '@/features/stocks/helpers/stockFormatters';
import type {
  StockMovement,
  StockMovementRequest,
} from '@/features/stocks/types/stock';

const PAGE_SIZE = 25;

export function ProductActivitySection({ productId }: { productId: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const request = useMemo<StockMovementRequest>(
    () => ({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      productId,
    }),
    [pagination, productId],
  );
  const activityQuery = useStockMovementsQuery(request);
  const rows = activityQuery.data?.payload.content ?? [];
  const page = activityQuery.data?.payload.page;

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('pages.products.details.inventory.columns.date'),
        cell: ({ row }) => formatStockDate(row.original.date, locale),
      },
      {
        accessorKey: 'movementType',
        header: t('pages.products.details.inventory.columns.type'),
        cell: ({ row }) =>
          t(`pages.stocks.movement-types.${row.original.movementType}`),
      },
      {
        id: 'quantityChange',
        header: () => (
          <div className='w-full text-right'>
            {t('pages.products.details.inventory.columns.change')}
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
        accessorKey: 'warehouseName',
        header: t('pages.products.details.inventory.columns.warehouse'),
        cell: ({ row }) => {
          const movement = row.original;
          const locationLabel =
            movement.movementType === 'TRANSFER_OUT'
              ? t('pages.products.details.inventory.source-warehouse')
              : movement.movementType === 'TRANSFER_IN'
                ? t('pages.products.details.inventory.destination-warehouse')
                : null;

          return (
            <div>
              <div>{movement.warehouseName}</div>
              {locationLabel && (
                <div className='text-xs text-zinc-400'>{locationLabel}</div>
              )}
            </div>
          );
        },
      },
      {
        id: 'document',
        header: t('pages.products.details.inventory.columns.transaction'),
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
    data: rows,
    columns,
    state: { pagination },
    manualPagination: true,
    pageCount: page?.totalPages ?? 0,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className='gap-0 border-zinc-700 bg-zinc-900 text-zinc-100 shadow-lg'>
      <CardHeader className='px-4 pb-4 sm:px-5'>
        <CardTitle className='flex items-center gap-2.5 text-base'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300'>
            <Activity className='h-4 w-4' aria-hidden='true' />
          </span>
          {t('pages.products.details.inventory.activity-title')}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {activityQuery.isPending ? (
          <DataTableLoadingState
            label={t('pages.products.details.inventory.loading-activity')}
          />
        ) : activityQuery.isError ? (
          <DataTableEmptyState
            title={t('pages.products.details.inventory.activity-error')}
            action={
              <Button onClick={() => void activityQuery.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : page?.totalElements === 0 ? (
          <DataTableEmptyState
            title={t('pages.products.details.inventory.no-activity')}
          />
        ) : (
          <>
            <DataTable table={table} horizontalScroll />
            <DataTablePagination
              totalRows={page?.totalElements ?? 0}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              pageCount={Math.max(page?.totalPages ?? 0, 1)}
              canPreviousPage={pagination.pageIndex > 0}
              canNextPage={pagination.pageIndex + 1 < (page?.totalPages ?? 0)}
              onPageChange={(pageIndex) =>
                setPagination((current) => ({ ...current, pageIndex }))
              }
              onPageSizeChange={(pageSize) =>
                setPagination({ pageIndex: 0, pageSize })
              }
              pageSizes={[10, 25, 50, 100]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
