'use client';

import { useTranslations } from 'next-intl';
import { GripVertical } from 'lucide-react';
import { useRef } from 'react';

interface ProductCategoryDragHandleProps {
  categoryId: number;
  categoryName: string;
  onDragStart: (categoryId: number) => void;
  onDragEnd: () => void;
  onPointerTargetChange: (categoryId: number | null) => void;
  onPointerDrop: (categoryId: number) => void;
}

export function ProductCategoryDragHandle({
  categoryId,
  categoryName,
  onDragStart,
  onDragEnd,
  onPointerTargetChange,
  onPointerDrop,
}: ProductCategoryDragHandleProps) {
  const t = useTranslations();
  const touchDragging = useRef(false);
  const label = t('pages.settings.tabs.product.actions.drag-category', {
    name: categoryName,
  });

  return (
    <button
      type='button'
      draggable
      aria-label={label}
      title={label}
      className='grid size-8 touch-none cursor-grab place-items-center rounded-md text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 active:cursor-grabbing'
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
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return;
        event.preventDefault();
        touchDragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragStart(categoryId);
      }}
      onPointerMove={(event) => {
        if (!touchDragging.current) return;
        event.preventDefault();
        const target = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-category-drop-id]');
        const targetId = Number(target?.dataset.categoryDropId);
        onPointerTargetChange(Number.isFinite(targetId) ? targetId : null);
      }}
      onPointerUp={(event) => {
        if (!touchDragging.current) return;
        event.preventDefault();
        const target = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-category-drop-id]');
        const targetId = Number(target?.dataset.categoryDropId);
        if (Number.isFinite(targetId)) onPointerDrop(targetId);
        touchDragging.current = false;
        onDragEnd();
      }}
      onPointerCancel={() => {
        if (!touchDragging.current) return;
        touchDragging.current = false;
        onDragEnd();
      }}
    >
      <GripVertical className='size-4' />
    </button>
  );
}
