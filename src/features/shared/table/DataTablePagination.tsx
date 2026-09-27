'use client';

import { Button } from '@/features/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { useTranslations } from 'next-intl';

interface DataTablePaginationProps {
  totalRows: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizes?: number[];
}

export function DataTablePagination({
  totalRows,
  pageIndex,
  pageSize,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 20, 50],
}: DataTablePaginationProps) {
  const t = useTranslations('common.table-pagination');
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalRows);

  return (
    <div className='flex flex-col items-center gap-3 border-t border-zinc-700 px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:justify-between'>
      <span className='text-center sm:text-left'>
        {totalRows === 0
          ? t('showing-empty')
          : t('showing', { start, end, total: totalRows })}
      </span>
      <div className='flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-2'>
        <div className='flex items-center justify-center gap-2'>
          <span className='whitespace-nowrap'>{t('rows-per-page')}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
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
        </div>
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='w-20 justify-center px-2 sm:w-24'
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPreviousPage}
          >
            {t('previous')}
          </Button>
          <Select
            value={String(pageIndex + 1)}
            onValueChange={(value) => onPageChange(Number(value) - 1)}
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
            className='w-20 justify-center px-2 sm:w-24'
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNextPage}
          >
            {t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
