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
import type {
  ProductCategory,
  ProductUnit,
} from '@/features/products/types/product';
import { Filter, Pencil, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ProductsToolbarProps {
  search: string;
  statusFilter: ProductStatus | 'ALL';
  categoryFilter: string;
  unitFilter: string;
  hasSelection: boolean;
  canManage: boolean;
  actionsDisabled: boolean;
  categories: ProductCategory[];
  units: ProductUnit[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onUnitFilterChange: (value: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

export function ProductsToolbar({
  search,
  statusFilter,
  categoryFilter,
  unitFilter,
  hasSelection,
  canManage,
  actionsDisabled,
  categories,
  units,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onUnitFilterChange,
  onAdd,
  onEdit,
  onArchive,
}: ProductsToolbarProps) {
  const t = useTranslations();

  return (
    <div className='flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 p-3'>
      {canManage && (
        <>
          <Button onClick={onAdd} disabled={actionsDisabled} className='gap-2'>
            <Plus />
            {t('pages.products.actions.add')}
          </Button>
          <Button
            variant='outline'
            onClick={onEdit}
            disabled={!hasSelection || actionsDisabled}
            className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
          >
            <Pencil />
            {t('pages.products.actions.edit')}
          </Button>
          <Button
            variant='outline'
            onClick={onArchive}
            disabled={!hasSelection}
            className='border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
          >
            {t('pages.products.actions.archive')}
          </Button>
        </>
      )}

      <div className='ml-auto flex w-full flex-wrap gap-2 sm:w-auto'>
        <label className='relative min-w-52 flex-1 sm:w-64 sm:flex-none'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            maxLength={200}
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
              side='bottom'
              avoidCollisions={false}
              align='end'
              className='border-zinc-700 bg-zinc-800 text-zinc-100'
            >
              <SelectItem value='ALL'>
                {t('pages.products.filters.all-statuses')}
              </SelectItem>
              <SelectItem value={ProductStatus.ACTIVE}>
                {t(`pages.products.status.${ProductStatus.ACTIVE}`)}
              </SelectItem>
              <SelectItem value={ProductStatus.DRAFT}>
                {t(`pages.products.status.${ProductStatus.DRAFT}`)}
              </SelectItem>
              <SelectItem value={ProductStatus.DISCONTINUED}>
                {t(`pages.products.status.${ProductStatus.DISCONTINUED}`)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger
            aria-label={t('pages.products.filters.category')}
            className='min-w-40 border-zinc-600 bg-zinc-900 text-zinc-100'
          >
            <SelectValue placeholder={t('pages.products.filters.category')} />
          </SelectTrigger>
          <SelectContent
            position='popper'
            side='bottom'
            avoidCollisions={false}
            align='end'
            className='border-zinc-700 bg-zinc-800 text-zinc-100'
          >
            <SelectItem value='ALL'>
              {t('pages.products.filters.all-categories')}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={unitFilter} onValueChange={onUnitFilterChange}>
          <SelectTrigger
            aria-label={t('pages.products.filters.unit')}
            className='min-w-36 border-zinc-600 bg-zinc-900 text-zinc-100'
          >
            <SelectValue placeholder={t('pages.products.filters.unit')} />
          </SelectTrigger>
          <SelectContent
            position='popper'
            side='bottom'
            avoidCollisions={false}
            align='end'
            className='border-zinc-700 bg-zinc-800 text-zinc-100'
          >
            <SelectItem value='ALL'>
              {t('pages.products.filters.all-units')}
            </SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={String(unit.id)}>
                {unit.name} ({unit.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
