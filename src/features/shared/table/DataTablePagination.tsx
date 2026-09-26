'use client';

import { Button } from '@/features/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import type { Table as ReactTable } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface DataTablePaginationProps<T> {
  table: ReactTable<T>;
  pageSizes?: number[];
  totalRows?: number;
}

export function DataTablePagination<T>({
  table,
  pageSizes = [10, 20, 50],
  totalRows = table.getFilteredRowModel().rows.length,
}: DataTablePaginationProps<T>) {
  const t = useTranslations('common.table-pagination');
  const { pageIndex, pageSize } = table.getState().pagination;
  const visibleRows = table.getRowModel().rows.length;
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = totalRows === 0 ? 0 : start + visibleRows - 1;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-700 px-4 py-3 text-sm text-zinc-400'>
      <span>
        {totalRows === 0
          ? t('showing-empty')
          : t('showing', { start, end, total: totalRows })}
      </span>
      <div className='flex items-center gap-2'>
        <span>{t('rows-per-page')}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger
            aria-label={t('rows-per-page')}
            size='sm'
            className='w-16 border-zinc-600 bg-zinc-900 px-2 text-zinc-100'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            position='popper'
            align='end'
            className='border-zinc-700 bg-zinc-800 text-zinc-100'
          >
            {pageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          size='sm'
          className='w-24 justify-center'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {t('previous')}
        </Button>
        <Select
          value={String(pageIndex + 1)}
          onValueChange={(value) => table.setPageIndex(Number(value) - 1)}
        >
          <SelectTrigger
            aria-label={t('page-selector')}
            size='sm'
            className='w-14 border-zinc-600 bg-zinc-900 px-2 text-zinc-100'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            position='popper'
            align='end'
            className='border-zinc-700 bg-zinc-800 text-zinc-100'
          >
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (page) => (
                <SelectItem key={page} value={String(page)}>
                  {page}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          size='sm'
          className='w-24 justify-center'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
