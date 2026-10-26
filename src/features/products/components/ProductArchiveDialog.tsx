'use client';

import { useTranslations } from 'next-intl';
import { Archive } from 'lucide-react';
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
        <AppDialogHeader
          title={t('pages.products.archive.title')}
          description={t('pages.products.archive.description', {
            name: productName ?? '',
          })}
          icon={Archive}
          hideDescription
        />
        <AppDialogBody>
          <AppDialogCard>
            {t('pages.products.archive.description', {
              name: productName ?? '',
            })}
          </AppDialogCard>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant='outline'
            className={appDialogCancelButtonClass}
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
            {saving ? t('common.saving') : t('pages.products.actions.archive')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
