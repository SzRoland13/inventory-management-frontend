'use client';

import { useTranslations } from 'next-intl';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/features/shared/components/ui/button';

export function CatalogRow({
  title,
  subtitle,
  description,
  icon,
  admin,
  selected,
  onSelect,
  onEdit,
  onDelete,
  depth = 0,
  dragHandle,
  dropTarget,
  dragging,
  leadingAction,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  admin: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  depth?: number;
  dragHandle?: React.ReactNode;
  dropTarget?: boolean;
  dragging?: boolean;
  leadingAction?: React.ReactNode;
}) {
  const t = useTranslations();
  const indent = Math.min(depth, 5) * 24;
  return (
    <div
      data-category-row
      style={
        depth
          ? { marginInlineStart: indent, width: `calc(100% - ${indent}px)` }
          : undefined
      }
      className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${depth ? 'border-l-2 border-l-sky-400/30' : ''} ${dropTarget ? 'ring-2 ring-sky-400/60' : ''} ${dragging ? 'opacity-40' : ''} ${selected ? 'border-sky-400/30 bg-sky-400/5' : 'border-zinc-700/80 bg-zinc-900/40 hover:bg-zinc-900/70'}`}
    >
      {leadingAction}
      {onSelect ? (
        <button
          type='button'
          onClick={onSelect}
          aria-label={title}
          className='grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-sky-300'
        >
          {icon}
        </button>
      ) : (
        <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-400'>
          {icon}
        </span>
      )}
      <button
        type='button'
        onClick={onSelect}
        disabled={!onSelect}
        className='min-w-0 flex-1 text-left disabled:cursor-default'
      >
        <span className='block truncate text-sm font-medium text-zinc-100'>
          {title}
        </span>
        {subtitle && (
          <span className='mt-0.5 block truncate text-xs text-zinc-500'>
            {subtitle}
          </span>
        )}
        {description && (
          <span className='mt-0.5 block truncate text-xs text-zinc-500'>
            {description}
          </span>
        )}
      </button>
      {selected !== undefined && (
        <span className='text-xs text-zinc-500'>
          {selected ? <Check className='size-4 text-sky-300' /> : null}
        </span>
      )}
      {admin && (
        <div className='ml-auto flex basis-full shrink-0 items-center justify-end gap-1 sm:basis-auto'>
          {dragHandle}
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`${t('pages.settings.tabs.product.actions.edit')} ${title}`}
            className='text-zinc-400 hover:text-zinc-900'
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`${t('pages.settings.tabs.product.actions.delete')} ${title}`}
            className='text-zinc-500 hover:text-rose-800'
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </div>
  );
}
