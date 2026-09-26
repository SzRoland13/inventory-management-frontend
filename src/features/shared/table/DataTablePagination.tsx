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
        <Button
          variant='outline'
          size='sm'
          className='w-24 justify-center'
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
          className='w-24 justify-center'
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNextPage}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
