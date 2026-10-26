'use client';

import type { SubmitEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Boxes } from 'lucide-react';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { Label } from '@/features/shared/components/ui/label';

export function EditorShell({
  open,
  onOpenChange,
  title,
  description,
  pending,
  children,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  pending: boolean;
  children: React.ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}) {
  const t = useTranslations();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent className='!w-[96vw] !max-w-2xl'>
        <AppDialogHeader title={title} description={description} icon={Boxes} />
        <form onSubmit={onSubmit} className='flex min-h-0 flex-1 flex-col'>
          <AppDialogBody>
            <AppDialogSection title={title} icon={Boxes}>
              <div className='space-y-5'>{children}</div>
            </AppDialogSection>
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
              type='submit'
              disabled={pending}
              className={appDialogPrimaryButtonClass}
            >
              {pending ? t('common.saving') : t('common.save')}
            </Button>
          </AppDialogFooter>
        </form>
      </ThemedDialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='space-y-2'>
      <Label className='text-zinc-300'>{label}</Label>
      {children}
    </div>
  );
}
