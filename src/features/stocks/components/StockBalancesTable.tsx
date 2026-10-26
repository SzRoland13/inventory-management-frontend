'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Input } from '@/features/shared/components/ui/input';
import { Routes } from '@/features/shared/types/routes';
import {
  StockProductFilter,
  StockWarehouseFilter,
} from '@/features/stocks/components/StockFilters';
import { StockTablePanel } from '@/features/stocks/components/StockTablePanel';
import { useStockBalancesQuery } from '@/features/stocks/queries/stockQueries';
import { formatStockQuantity } from '@/features/stocks/helpers/stockFormatters';
import type {
  StockBalance,
  StockBalanceRequest,
} from '@/features/stocks/types/stock';

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 25 };
const EMPTY_BALANCES: StockBalance[] = [];
const FILTER_CLASS = 'border-zinc-600 bg-zinc-900 text-zinc-100';

export function StockBalancesTable({
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
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('ALL');
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const request = useMemo<StockBalanceRequest>(
    () => ({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      search: search.trim() || undefined,
      productId: productId === 'ALL' ? undefined : Number(productId),
      warehouseId: warehouseId === 'ALL' ? undefined : Number(warehouseId),
    }),
    [pagination, search, productId, warehouseId],
  );
  const balancesQuery = useStockBalancesQuery(request, enabled);
  const balances = balancesQuery.data?.payload.content ?? EMPTY_BALANCES;
  const page = balancesQuery.data?.payload.page;

  const columns = useMemo<ColumnDef<StockBalance>[]>(
    () => [
      {
        accessorKey: 'productSku',
        header: t('pages.stocks.columns.product'),
        cell: ({ row }) => (
          <Link
            href={`${Routes.Products}/${row.original.productId}?from=stocks&view=balances&productId=${row.original.productId}`}
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
        id: 'quantity',
        header: () => (
          <div className='w-full text-right'>
            {t('pages.stocks.columns.quantity')}
          </div>
        ),
        cell: ({ row }) => (
          <div className='w-full text-right tabular-nums'>
            {formatStockQuantity(
              row.original.quantity,
              row.original.mainUnit.symbol,
              locale,
            )}
            {row.original.secondaryUnit &&
              row.original.secondaryQuantity !== null && (
                <div className='text-xs text-zinc-400'>
                  {formatStockQuantity(
                    row.original.secondaryQuantity,
                    row.original.secondaryUnit.symbol,
                    locale,
                  )}
                </div>
              )}
          </div>
        ),
      },
    ],
    [locale, t],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: balances,
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
        <label className='relative min-w-52 flex-1 sm:w-64 sm:flex-none'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
          <Input
            value={search}
            onChange={(event) => updateFilter(() => setSearch(event.target.value))}
            maxLength={200}
            placeholder={t('pages.stocks.search')}
            aria-label={t('pages.stocks.search')}
            className={`${FILTER_CLASS} pl-9`}
          />
        </label>
        <StockProductFilter
          value={productId}
          onChange={(value) => updateFilter(() => onProductIdChange(value))}
        />
        <StockWarehouseFilter
          value={warehouseId}
          onChange={(value) => updateFilter(() => setWarehouseId(value))}
        />
      </div>
      <StockTablePanel
        table={table}
        isPending={balancesQuery.isPending}
        isError={balancesQuery.isError}
        totalRows={page?.totalElements ?? 0}
        pageCount={page?.totalPages ?? 0}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        loadingLabel={t('pages.stocks.loading-balances')}
        emptyLabel={t('pages.stocks.empty-balances')}
        onRetry={() => void balancesQuery.refetch()}
        onPageChange={(pageIndex) =>
          setPagination((current) => ({ ...current, pageIndex }))
        }
        onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
      />
    </section>
  );
}
