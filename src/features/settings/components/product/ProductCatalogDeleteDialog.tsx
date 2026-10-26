'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import {
  AppDialogBody,
  AppDialogCard,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';

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
      <ThemedDialogContent>
        <AppDialogHeader
          title={t('pages.settings.tabs.product.delete.title')}
          description={t(
            `pages.settings.tabs.product.delete.description.${target?.type ?? 'brand'}`,
            { name: target?.name ?? '' },
          )}
          icon={Trash2}
          hideDescription
        />
        <AppDialogBody>
          <AppDialogCard>
            {t(
              `pages.settings.tabs.product.delete.description.${target?.type ?? 'brand'}`,
              { name: target?.name ?? '' },
            )}
          </AppDialogCard>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            type='button'
            variant='outline'
            className={appDialogCancelButtonClass}
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
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
