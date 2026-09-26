'use client';

import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ProductStatus } from '@/features/products/types/product';
import { Filter, Pencil, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ProductsToolbarProps {
  search: string;
  statusFilter: string;
  hasSelection: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onAdd: () => void;
  onEdit: () => void;
}

export function ProductsToolbar({
  search,
  statusFilter,
  hasSelection,
  onSearchChange,
  onStatusFilterChange,
  onAdd,
  onEdit,
}: ProductsToolbarProps) {
  const t = useTranslations();

  return (
    <div className='flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 p-3'>
      <Button onClick={onAdd} className='gap-2'>
        <Plus />
        {t('pages.products.actions.add')}
      </Button>
      <Button
        variant='outline'
        onClick={onEdit}
        disabled={!hasSelection}
        className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
      >
        <Pencil />
        {t('pages.products.actions.edit')}
      </Button>

      <div className='ml-auto flex w-full flex-wrap gap-2 sm:w-auto'>
        <label className='relative min-w-52 flex-1 sm:w-64 sm:flex-none'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('pages.products.search-placeholder')}
            aria-label={t('pages.products.search-placeholder')}
            className='pl-9'
          />
        </label>

        <div className='relative flex items-center gap-2'>
          <Filter className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger
              aria-label={t('pages.products.filters.status')}
              className='h-9 min-w-36 border-zinc-600 bg-zinc-900 pl-9 text-zinc-100'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position='popper'
              align='end'
              className='border-zinc-700 bg-zinc-800 text-zinc-100'
            >
              <SelectItem value='ALL'>
                {t('pages.products.filters.all-statuses')}
              </SelectItem>
              <SelectItem value={ProductStatus.ACTIVE}>
                {t(`pages.products.status.${ProductStatus.ACTIVE}`)}
              </SelectItem>
              <SelectItem value={ProductStatus.INACTIVE}>
                {t(`pages.products.status.${ProductStatus.INACTIVE}`)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
