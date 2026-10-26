'use client';

import { useMemo, useState } from 'react';
import type { ProductResponse } from '@/features/products/types/product';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { Input } from '@/features/shared/components/ui/input';
import { Dialog } from '@/features/shared/components/ui/dialog';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import type { Table } from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  Columns3,
  GripVertical,
  Search,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const ATTRIBUTE_COLUMN_ID_PREFIX = 'attribute-';

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
  const [search, setSearch] = useState('');
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const order = table.getState().columnOrder;
  const orderById = useMemo(
    () => new Map(order.map((id, index) => [id, index])),
    [order],
  );
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
    .sort(
      (left, right) =>
        (orderById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredColumns = columns.filter((column) =>
    getColumnLabel(column.id, column.columnDef.meta)
      .toLocaleLowerCase()
      .includes(normalizedSearch),
  );
  const productColumns = filteredColumns.filter(
    (column) => !column.id.startsWith(ATTRIBUTE_COLUMN_ID_PREFIX),
  );
  const attributeColumns = filteredColumns.filter((column) =>
    column.id.startsWith(ATTRIBUTE_COLUMN_ID_PREFIX),
  );
  const standardColumnIds = columns
    .filter((column) => !column.id.startsWith(ATTRIBUTE_COLUMN_ID_PREFIX))
    .map((column) => column.id);
  const attributeColumnIds = columns
    .filter((column) => column.id.startsWith(ATTRIBUTE_COLUMN_ID_PREFIX))
    .map((column) => column.id);

  function getGroupColumnIds(columnId: string) {
    return columnId.startsWith(ATTRIBUTE_COLUMN_ID_PREFIX)
      ? attributeColumnIds
      : standardColumnIds;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setSearch('');
    onOpenChange(nextOpen);
  }

  function getColumnLabel(columnId: string, meta: unknown): string {
    const customLabel = (meta as { label?: string } | undefined)?.label;
    if (customLabel) return customLabel;
    const messageId = columnId === 'netPrice' ? 'net-price' : columnId;
    return t(`pages.products.table.${messageId}`);
  }

  function setReorderedColumns(
    groupColumnIds: string[],
    nextGroupColumnIds: string[],
  ) {
    const currentOrder = table.getState().columnOrder;
    const allReorderableIds = new Set([
      ...standardColumnIds,
      ...attributeColumnIds,
    ]);
    const otherIds = currentOrder.filter(
      (id) => !allReorderableIds.has(id) && id !== 'sku',
    );
    table.setColumnOrder([
      ...(currentOrder.includes('sku') ? ['sku'] : []),
      ...(groupColumnIds === standardColumnIds
        ? nextGroupColumnIds
        : standardColumnIds),
      ...(groupColumnIds === attributeColumnIds
        ? nextGroupColumnIds
        : attributeColumnIds),
      ...otherIds,
    ]);
  }

  function moveColumn(columnId: string, offset: number) {
    const groupColumnIds = getGroupColumnIds(columnId);
    const currentIndex = groupColumnIds.indexOf(columnId);
    const targetIndex = currentIndex + offset;
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= groupColumnIds.length
    )
      return;
    const nextIds = [...groupColumnIds];
    nextIds.splice(currentIndex, 1);
    nextIds.splice(targetIndex, 0, columnId);
    setReorderedColumns(groupColumnIds, nextIds);
  }

  function dropColumn(targetId: string) {
    if (!draggedColumnId || draggedColumnId === targetId) return;
    const groupColumnIds = getGroupColumnIds(draggedColumnId);
    if (groupColumnIds !== getGroupColumnIds(targetId)) return;
    const fromIndex = groupColumnIds.indexOf(draggedColumnId);
    const targetIndex = groupColumnIds.indexOf(targetId);
    if (fromIndex < 0 || targetIndex < 0) return;
    const nextIds = [...groupColumnIds];
    nextIds.splice(fromIndex, 1);
    nextIds.splice(targetIndex, 0, draggedColumnId);
    setReorderedColumns(groupColumnIds, nextIds);
  }

  function renderColumn(column: (typeof columns)[number]) {
    const groupColumnIds = getGroupColumnIds(column.id);
    const columnIndex = groupColumnIds.indexOf(column.id);
    const label = getColumnLabel(column.id, column.columnDef.meta);
    const isAttribute = column.id.startsWith(ATTRIBUTE_COLUMN_ID_PREFIX);

    return (
      <div
        key={column.id}
        role='listitem'
        onDragOver={(event) => {
          if (
            draggedColumnId &&
            getGroupColumnIds(draggedColumnId) === groupColumnIds
          ) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDropTargetId(column.id);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dropColumn(column.id);
          setDraggedColumnId(null);
          setDropTargetId(null);
        }}
        className={`group flex min-w-0 items-center gap-2 rounded-xl border bg-zinc-800/70 p-2.5 transition-colors ${dropTargetId === column.id ? 'border-sky-400/70 ring-2 ring-sky-400/30' : 'border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-800'}`}
      >
        <button
          type='button'
          draggable
          aria-label={t('pages.products.columns.drag', { column: label })}
          title={t('pages.products.columns.drag', { column: label })}
          className='grid size-8 shrink-0 cursor-grab place-items-center rounded-md text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 active:cursor-grabbing'
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', column.id);
            setDraggedColumnId(column.id);
          }}
          onDragEnd={() => {
            setDraggedColumnId(null);
            setDropTargetId(null);
          }}
        >
          <GripVertical aria-hidden='true' className='size-4' />
        </button>

        <label
          htmlFor={`product-column-${column.id}`}
          className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1'
        >
          <Checkbox
            id={`product-column-${column.id}`}
            checked={column.getIsVisible()}
            onCheckedChange={() => column.toggleVisibility()}
          />
          <span className='truncate text-sm font-medium text-zinc-100'>
            {label}
          </span>
          {isAttribute && (
            <span className='ml-auto shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400'>
              {t('pages.products.columns.attribute-tag')}
            </span>
          )}
        </label>

        <div className='flex shrink-0 items-center'>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={t('pages.products.columns.move-up', { column: label })}
            title={t('pages.products.columns.move-up', { column: label })}
            disabled={columnIndex === 0}
            onClick={() => moveColumn(column.id, -1)}
            className='text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30'
          >
            <ChevronUp aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={t('pages.products.columns.move-down', {
              column: label,
            })}
            title={t('pages.products.columns.move-down', { column: label })}
            disabled={columnIndex === groupColumnIds.length - 1}
            onClick={() => moveColumn(column.id, 1)}
            className='text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30'
          >
            <ChevronDown aria-hidden='true' />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ThemedDialogContent className='!w-[96vw] !max-w-2xl max-h-[85dvh]'>
        <AppDialogHeader
          title={t('pages.products.columns.title')}
          description={t('pages.products.columns.description')}
          icon={Columns3}
        />

        <AppDialogBody className='flex flex-col gap-4 overflow-hidden'>
          <label className='relative block shrink-0'>
            <Search
              aria-hidden='true'
              className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400'
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('pages.products.columns.search')}
              aria-label={t('pages.products.columns.search')}
              className='border-zinc-700 bg-zinc-800 pl-9 text-zinc-100 placeholder:text-zinc-500'
            />
          </label>

          <div
            role='list'
            aria-label={t('pages.products.columns.title')}
            className='min-h-0 flex-1 space-y-5 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {productColumns.length > 0 && (
              <section className='space-y-2'>
                <h3 className='px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400'>
                  {t('pages.products.columns.product-fields')}
                </h3>
                <div className='grid gap-2'>
                  {productColumns.map(renderColumn)}
                </div>
              </section>
            )}
            {attributeColumns.length > 0 && (
              <section className='space-y-2'>
                <h3 className='px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400'>
                  {t('pages.products.columns.attributes')}
                </h3>
                <div className='grid gap-2'>
                  {attributeColumns.map(renderColumn)}
                </div>
              </section>
            )}
            {filteredColumns.length === 0 && (
              <p className='py-8 text-center text-sm text-zinc-400'>
                {t('pages.products.columns.no-matches')}
              </p>
            )}
          </div>
        </AppDialogBody>

        <AppDialogFooter className='justify-between sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={onReset}
          >
            {t('pages.products.columns.reset')}
          </Button>
          <Button
            type='button'
            className={appDialogPrimaryButtonClass}
            onClick={() => handleOpenChange(false)}
          >
            {t('common.done')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
