'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDocumentQuery, useUpdateDocumentDraftMutation } from '@/features/documents/queries/documentQueries';
import type { BusinessDocument, DocumentDraftRequest } from '@/features/documents/types/documents';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';

type Props = { document: BusinessDocument | null; onClose: () => void };
type SaveState = 'saved' | 'saving' | 'error' | 'conflict';

export function DocumentDraftEditor({ document, onClose }: Props) {
  const t = useTranslations();
  const detail = useDocumentQuery(document?.id ?? null, false);
  const update = useUpdateDocumentDraftMutation();
  const current = detail.data?.payload ?? document;
  const versionRef = useRef(current?.version ?? '');
  const dirtyRef = useRef(false);
  const editSequence = useRef(0);
  const saveInFlight = useRef(false);
  const queuedSave = useRef(false);
  const [date, setDate] = useState(current?.date ?? '');
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [quantities, setQuantities] = useState<Record<number, number>>(() => Object.fromEntries((current?.lines ?? []).map((line) => [line.id, line.orderedQuantity])));
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const draftState = useRef({ current, date, notes, quantities });
  draftState.current = { current, date, notes, quantities };

  useEffect(() => {
    versionRef.current = current?.version ?? '';
    if (!dirtyRef.current && current) {
      setDate(current.date);
      setNotes(current.notes ?? '');
      setQuantities(Object.fromEntries(current.lines.map((line) => [line.id, line.orderedQuantity])));
    }
  }, [current]);

  useEffect(() => {
    if (!current || !dirtyRef.current || saveState === 'conflict') return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      void saveDraft();
    }, 800);
    return () => window.clearTimeout(timeout);
    // saveDraft reads the latest form state after the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, notes, quantities]);

  async function saveDraft(version = versionRef.current) {
    if (saveInFlight.current) {
      queuedSave.current = true;
      return;
    }
    const snapshot = draftState.current;
    if (!snapshot.current) return;
    const sequence = editSequence.current;
    const request: DocumentDraftRequest = {
      type: snapshot.current.type as DocumentDraftRequest['type'],
      partnerId: snapshot.current.partnerId,
      warehouseId: snapshot.current.warehouseId,
      date: snapshot.date,
      notes: snapshot.notes,
      lines: snapshot.current.lines.map((line) => ({
        productId: line.productId,
        unitId: line.unitId,
        quantity: snapshot.quantities[line.id] ?? line.orderedQuantity,
        ...(line.unitPrice === undefined ? {} : { unitPrice: line.unitPrice }),
      })),
    };
    saveInFlight.current = true;
    try {
      const saved = await update.mutateAsync({ id: snapshot.current.id, request: { version, draft: request } });
      versionRef.current = saved.payload.version;
      if (sequence === editSequence.current) {
        dirtyRef.current = false;
        setSaveState('saved');
      } else {
        dirtyRef.current = true;
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setSaveState(status === 409 ? 'conflict' : 'error');
      if (status === 409) queuedSave.current = false;
      if (status !== 409) toastApiError(t, error);
    } finally {
      saveInFlight.current = false;
      if (queuedSave.current) {
        queuedSave.current = false;
        window.setTimeout(() => void saveDraft(versionRef.current), 0);
      }
    }
  }

  async function reloadServerVersion() {
    const latest = await detail.refetch();
    if (!latest.data?.payload) return;
    versionRef.current = latest.data.payload.version;
    dirtyRef.current = false;
    setDate(latest.data.payload.date);
    setNotes(latest.data.payload.notes ?? '');
    setQuantities(Object.fromEntries(latest.data.payload.lines.map((line) => [line.id, line.orderedQuantity])));
    setSaveState('saved');
  }

  async function saveLocalAgainstLatest() {
    const latest = await detail.refetch();
    if (latest.data?.payload) {
      versionRef.current = latest.data.payload.version;
      setSaveState('saving');
      await saveDraft(latest.data.payload.version);
    }
  }

  function change<T>(setter: (value: T) => void, value: T) {
    dirtyRef.current = true;
    editSequence.current += 1;
    setter(value);
  }

  if (!current) return null;
  const statusText = {
    saved: t('pages.documents.editor.saved'),
    saving: t('pages.documents.editor.saving'),
    error: t('pages.documents.editor.error'),
    conflict: t('pages.documents.editor.conflict'),
  }[saveState];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto border-zinc-700 bg-zinc-900 text-zinc-100'>
        <DialogHeader>
          <DialogTitle>{t('pages.documents.editor.title', { number: current.number || t('pages.documents.draft') })}</DialogTitle>
          <DialogDescription className='text-zinc-400'>{t('pages.documents.editor.description')}</DialogDescription>
        </DialogHeader>
        <div className='mb-4 flex items-center gap-2 text-sm' aria-live='polite'>
          <span className={`h-2 w-2 rounded-full ${saveState === 'saved' ? 'bg-emerald-400' : saveState === 'error' || saveState === 'conflict' ? 'bg-rose-400' : 'animate-pulse bg-amber-300'}`} />
          <span className={saveState === 'saved' ? 'text-emerald-200' : 'text-zinc-300'}>{statusText}</span>
        </div>
        {saveState === 'conflict' && <div className='mb-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-sm'>
          <p className='font-medium text-amber-100'>{t('pages.documents.editor.conflictTitle')}</p>
          <p className='mt-1 text-zinc-300'>{t('pages.documents.editor.conflictDescription')}</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            <Button size='sm' variant='outline' className='border-zinc-600 bg-zinc-800' onClick={() => void reloadServerVersion()}>{t('pages.documents.editor.reload')}</Button>
            <Button size='sm' onClick={() => void saveLocalAgainstLatest()}>{t('pages.documents.editor.keepMine')}</Button>
          </div>
        </div>}
        <div className='space-y-5'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'><Label htmlFor='edit-document-date'>{t('pages.documents.create.date')}</Label><Input id='edit-document-date' type='date' value={date} onChange={(event) => change(setDate, event.target.value)} className='border-zinc-600 bg-zinc-800' /></div>
            <div className='space-y-2'><Label htmlFor='edit-document-notes'>{t('pages.documents.create.notes')}</Label><Input id='edit-document-notes' value={notes} onChange={(event) => change(setNotes, event.target.value)} maxLength={2000} className='border-zinc-600 bg-zinc-800' /></div>
          </div>
          <section className='space-y-2'><h3 className='text-sm font-semibold'>{t('pages.documents.create.items')}</h3>
            {current.lines.map((line) => <div key={line.id} className='grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3'><div className='min-w-0'><p className='truncate text-sm font-medium'>{line.productName}</p><p className='text-xs text-zinc-500'>{line.productCode} · {line.unitName}</p></div><Input type='number' min='0.001' step='any' aria-label={t('pages.documents.create.quantity')} value={quantities[line.id] ?? line.orderedQuantity} onChange={(event) => change(setQuantities, { ...quantities, [line.id]: Number(event.target.value) })} className='border-zinc-600 bg-zinc-950 text-right tabular-nums' /></div>)}
          </section>
        </div>
        <DialogFooter className='mt-5'><Button variant='outline' onClick={onClose} className='border-zinc-600 bg-zinc-800'>{t('common.done')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
