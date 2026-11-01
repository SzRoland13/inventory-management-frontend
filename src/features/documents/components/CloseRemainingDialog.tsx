'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PackageX } from 'lucide-react';
import { toast } from 'sonner';
import { useCloseRemainingMutation } from '@/features/documents/queries/documentQueries';
import { closeRemainingSchema } from '@/features/documents/schemas/documentSchemas';
import type { BusinessDocument } from '@/features/documents/types/documents';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Label } from '@/features/shared/components/ui/label';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';

type Props = { document: BusinessDocument | null; onClose: () => void };

export function CloseRemainingDialog({ document, onClose }: Props) {
  const t = useTranslations();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const closeRemaining = useCloseRemainingMutation();
  if (!document) return null;

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!document) return;
    const validation = closeRemainingSchema.safeParse({ reason });
    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ??
          'pages.documents.validation.required',
      );
      return;
    }
    setError('');
    try {
      await closeRemaining.mutateAsync({
        id: document.id,
        version: document.version,
        request: validation.data,
      });
      toast.success(t('pages.documents.closeRemaining.completed'));
      onClose();
    } catch (cause) {
      toastApiError(t, cause);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <ThemedDialogContent className='!max-w-2xl'>
        <AppDialogHeader
          title={t('pages.documents.closeRemaining.title')}
          description={t('pages.documents.closeRemaining.description')}
          icon={PackageX}
        />
        <AppDialogBody className='space-y-4'>
          <div className='space-y-2 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3'>
            {document.lines
              .filter((line) => line.remainingQuantity > 0)
              .map((line) => (
                <div
                  key={line.id}
                  className='grid grid-cols-[minmax(0,1fr)_repeat(3,auto)] items-center gap-3 rounded-lg px-2 py-2 text-sm'
                >
                  <span className='truncate font-medium'>
                    {line.productName}
                  </span>
                  <span className='text-right text-zinc-400'>
                    {t('pages.documents.closeRemaining.ordered')}
                    <b className='ml-1 text-zinc-200'>{line.orderedQuantity}</b>
                  </span>
                  <span className='text-right text-zinc-400'>
                    {t('pages.documents.closeRemaining.fulfilled')}
                    <b className='ml-1 text-zinc-200'>
                      {line.fulfilledQuantity}
                    </b>
                  </span>
                  <span className='text-right text-zinc-400'>
                    {t('pages.documents.closeRemaining.remaining')}
                    <b className='ml-1 text-amber-200'>
                      {line.remainingQuantity} {line.unitName}
                    </b>
                  </span>
                </div>
              ))}
          </div>
          <form
            id='close-remaining-form'
            onSubmit={(event) => void submit(event)}
            className='space-y-2'
          >
            <Label htmlFor='close-reason'>
              {t('pages.documents.closeRemaining.reason')}
            </Label>
            <textarea
              id='close-reason'
              required
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className='min-h-24 w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
            />
            {error && <p className='text-xs text-rose-300'>{t(error)}</p>}
          </form>
        </AppDialogBody>
        <AppDialogFooter className='gap-2 sm:gap-2'>
          <Button
            type='button'
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            form='close-remaining-form'
            disabled={
              closeRemaining.isPending ||
              !document.lines.some((line) => line.remainingQuantity > 0)
            }
            className={appDialogPrimaryButtonClass}
          >
            {t(
              closeRemaining.isPending
                ? 'pages.documents.closeRemaining.saving'
                : 'pages.documents.closeRemaining.confirm',
            )}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
