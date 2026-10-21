'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/features/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';

export interface ProductCatalogDeleteTarget {
  type: 'unit' | 'brand' | 'category' | 'attribute' | 'option';
  id: number;
  parentId?: number;
  name: string;
}

interface ProductCatalogDeleteDialogProps {
  target: ProductCatalogDeleteTarget | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ProductCatalogDeleteDialog({
  target,
  pending,
  onOpenChange,
  onConfirm,
}: ProductCatalogDeleteDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
        <DialogHeader>
          <DialogTitle>
            {t('pages.settings.tabs.product.delete.title')}
          </DialogTitle>
          <DialogDescription className='text-zinc-400'>
            {t(
              `pages.settings.tabs.product.delete.description.${target?.type ?? 'brand'}`,
              { name: target?.name ?? '' },
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            className='border-zinc-700 text-zinc-900'
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='button'
            variant='destructive'
            disabled={pending}
            onClick={onConfirm}
          >
            <Trash2 />
            {t('pages.settings.tabs.product.actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
