'use client';

import { useTranslations } from 'next-intl';
import { GripVertical } from 'lucide-react';

interface ProductCategoryDragHandleProps {
  categoryId: number;
  categoryName: string;
  onDragStart: (categoryId: number) => void;
  onDragEnd: () => void;
}

export function ProductCategoryDragHandle({
  categoryId,
  categoryName,
  onDragStart,
  onDragEnd,
}: ProductCategoryDragHandleProps) {
  const t = useTranslations();
  const label = t('pages.settings.tabs.product.actions.drag-category', {
    name: categoryName,
  });

  return (
    <button
      type='button'
      draggable
      aria-label={label}
      title={label}
      className='grid size-8 cursor-grab place-items-center rounded-md text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 active:cursor-grabbing'
      onDragStart={(event) => {
        const row = event.currentTarget.closest<HTMLElement>(
          '[data-category-row]',
        );
        if (row) {
          const bounds = row.getBoundingClientRect();
          event.dataTransfer.setDragImage(
            row,
            event.clientX - bounds.left,
            event.clientY - bounds.top,
          );
        }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(categoryId));
        onDragStart(categoryId);
      }}
      onDragEnd={onDragEnd}
    >
      <GripVertical className='size-4' />
    </button>
  );
}
