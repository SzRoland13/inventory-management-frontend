'use client';

import { useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { Boxes, Warehouse } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ProductResponse } from '@/features/products/types/product';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/features/shared/components/ui/card';
import { Button } from '@/features/shared/components/ui/button';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { DataTablePagination } from '@/features/shared/table/DataTablePagination';
import { useStockBalancesQuery } from '@/features/stocks/queries/stockQueries';
import { formatStockQuantity } from '@/features/stocks/helpers/stockFormatters';
import type { StockBalanceRequest } from '@/features/stocks/types/stock';

const PAGE_SIZE = 25;

export function ProductStockSection({ product }: { product: ProductResponse }) {
  const t = useTranslations();
  const locale = useLocale();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const request = useMemo<StockBalanceRequest>(
    () => ({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      productId: product.id,
    }),
    [pagination, product.id],
  );
  const stockQuery = useStockBalancesQuery(request);
  const rows = stockQuery.data?.payload.content ?? [];
  const page = stockQuery.data?.payload.page;
  const totalStock = product.stockByWarehouse.reduce(
    (total, warehouseStock) =>
      total + warehouseStock.stockQuantity.amount,
    0,
  );
  const mainUnit =
    product.stockByWarehouse[0]?.stockQuantity.unit ?? product.units.main;

  return (
    <Card className='gap-0 overflow-hidden rounded-2xl border-zinc-700/80 bg-zinc-900/95 text-zinc-100 shadow-xl shadow-black/10'>
      <CardHeader className='flex flex-row items-center justify-between gap-4 border-b border-zinc-800 px-5 py-5 sm:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200'>
            <Boxes className='h-[18px] w-[18px]' aria-hidden='true' />
          </span>
          <div className='min-w-0'>
            <CardTitle className='text-base font-semibold tracking-tight'>
              {t('pages.products.details.inventory.stock-title')}
            </CardTitle>
            {page && (
              <p className='mt-1 text-sm text-zinc-400'>
                {t('pages.products.details.inventory.warehouse-count', {
                  count: page.totalElements,
                })}
              </p>
            )}
          </div>
        </div>
        <div className='shrink-0 rounded-xl border border-emerald-900/70 bg-emerald-950/40 px-3.5 py-2 text-right sm:px-4'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70'>
            {t('pages.products.details.inventory.total')}
          </p>
          <p className='mt-0.5 text-base font-semibold tabular-nums text-emerald-100'>
            {formatStockQuantity(totalStock, mainUnit.symbol, locale)}
          </p>
        </div>
      </CardHeader>
      <CardContent className='p-4 sm:p-5'>
        {stockQuery.isPending ? (
          <DataTableLoadingState
            label={t('pages.products.details.inventory.loading-stock')}
          />
        ) : stockQuery.isError ? (
          <DataTableEmptyState
            title={t('pages.products.details.inventory.stock-error')}
            action={
              <Button onClick={() => void stockQuery.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : page?.totalElements === 0 ? (
          <DataTableEmptyState
            title={t('pages.products.details.inventory.no-stock')}
          />
        ) : (
          <div className='divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/35'>
            {rows.map((stock) => (
              <div
                key={stock.warehouseId}
                className='flex min-h-[76px] items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/40 sm:px-5'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400'>
                    <Warehouse className='h-4 w-4' aria-hidden='true' />
                  </span>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-zinc-100'>
                      {stock.warehouseName}
                    </p>
                    <p className='mt-0.5 text-xs text-zinc-500'>
                      {t('pages.products.details.inventory.columns.warehouse')}
                    </p>
                  </div>
                </div>
                <div className='shrink-0 text-right tabular-nums'>
                  <p className='text-sm font-semibold text-zinc-100'>
                    {formatStockQuantity(
                      stock.quantity,
                      stock.mainUnit.symbol,
                      locale,
                    )}
                  </p>
                  {stock.secondaryUnit &&
                    stock.secondaryQuantity !== null && (
                      <p className='mt-0.5 text-xs text-zinc-400'>
                        {formatStockQuantity(
                          stock.secondaryQuantity,
                          stock.secondaryUnit.symbol,
                          locale,
                        )}
                      </p>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
        {page && page.totalElements > pagination.pageSize && (
          <div className='mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/25'>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
