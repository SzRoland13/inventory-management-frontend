'use client';

import type { SubmitEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/features/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/shared/components/ui/dialog';
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
      <DialogContent className='max-h-[90dvh] overflow-y-auto border-zinc-700 bg-zinc-900 text-zinc-100'>
        <form onSubmit={onSubmit} className='space-y-5'>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className='text-zinc-400'>
              {description}
            </DialogDescription>
          </DialogHeader>
          {children}
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
              type='submit'
              disabled={pending}
              className='bg-sky-500 text-zinc-950 hover:bg-sky-400 disabled:bg-sky-900/70 disabled:text-sky-100/70'
            >
              {pending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
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
