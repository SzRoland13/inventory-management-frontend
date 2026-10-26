'use client';

import { useTranslations } from 'next-intl';
import type { Table as TanStackTable } from '@tanstack/react-table';
import { Button } from '@/features/shared/components/ui/button';
import { DataTable } from '@/features/shared/table/DataTable';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { DataTablePagination } from '@/features/shared/table/DataTablePagination';

interface StockTablePanelProps<T> {
  table: TanStackTable<T>;
  isPending: boolean;
  isError: boolean;
  totalRows: number;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  loadingLabel: string;
  emptyLabel: string;
  onRetry: () => void;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function StockTablePanel<T>({
  table,
  isPending,
  isError,
  totalRows,
  pageCount,
  pageIndex,
  pageSize,
  loadingLabel,
  emptyLabel,
  onRetry,
  onPageChange,
  onPageSizeChange,
}: StockTablePanelProps<T>) {
  const t = useTranslations();

  if (isPending) return <DataTableLoadingState label={loadingLabel} />;

  if (isError) {
    return (
      <DataTableEmptyState
        title={t('pages.stocks.load-error')}
        action={
          <Button onClick={onRetry}>{t('common.retry')}</Button>
        }
      />
    );
  }

  if (totalRows === 0) {
    return <DataTableEmptyState title={emptyLabel} />;
  }

  return (
    <>
      <DataTable table={table} horizontalScroll />
      <DataTablePagination
        totalRows={totalRows}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={Math.max(pageCount, 1)}
        canPreviousPage={pageIndex > 0}
        canNextPage={pageIndex + 1 < pageCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizes={[10, 25, 50, 100]}
      />
    </>
  );
}
