'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/features/shared/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';

interface ProductArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  saving: boolean;
  canArchive: boolean;
  onArchive: () => void;
}

export function ProductArchiveDialog({
  open,
  onOpenChange,
  productName,
  saving,
  canArchive,
  onArchive,
}: ProductArchiveDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent>
        <DialogHeader>
          <DialogTitle>{t('pages.products.archive.title')}</DialogTitle>
        </DialogHeader>
        <DialogDescription className='text-sm text-zinc-300'>
          {t('pages.products.archive.description', {
            name: productName ?? '',
          })}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant='secondary'
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='destructive'
            onClick={onArchive}
            disabled={saving || !canArchive}
          >
            {saving
              ? t('common.saving')
              : t('pages.products.actions.archive')}
          </Button>
        </DialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
