'use client';

import type { ProductResponse } from '@/features/products/types/product';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';
import type { Table } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface ProductColumnVisibilityDialogProps {
  open: boolean;
  table: Table<ProductResponse>;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
}

export function ProductColumnVisibilityDialog({
  open,
  table,
  onOpenChange,
  onReset,
}: ProductColumnVisibilityDialogProps) {
  const t = useTranslations();
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85dvh] flex-col overflow-hidden border-zinc-700 bg-zinc-900 text-zinc-100'>
        <DialogHeader>
          <DialogTitle>{t('pages.products.columns.title')}</DialogTitle>
          <DialogDescription className='text-zinc-400'>
            {t('pages.products.columns.description')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid-cols-2'>
          {columns.map((column) => (
            <label
              key={column.id}
              className='flex cursor-pointer items-center gap-3 rounded-md border border-zinc-700 p-3'
            >
              <Checkbox
                checked={column.getIsVisible()}
                onCheckedChange={() => column.toggleVisibility()}
              />
              <span>
                {t(
                  `pages.products.table.${column.id === 'netPrice' ? 'net-price' : column.id}`,
                )}
              </span>
            </label>
          ))}
        </div>
        <DialogFooter className='shrink-0 justify-between border-t border-zinc-700 pt-4 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white'
            onClick={onReset}
          >
            {t('pages.products.columns.reset')}
          </Button>
          <Button
            type='button'
            className='bg-sky-600 text-white hover:bg-sky-500'
            onClick={() => onOpenChange(false)}
          >
            {t('common.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
