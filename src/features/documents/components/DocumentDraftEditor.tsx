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
  const savePromise = useRef<Promise<boolean> | null>(null);
  const saveTimer = useRef<number | null>(null);
  const saveStateRef = useRef<SaveState>('saved');
  const [date, setDate] = useState(current?.date ?? '');
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [quantities, setQuantities] = useState<Record<number, number>>(() => Object.fromEntries((current?.lines ?? []).map((line) => [line.id, line.orderedQuantity])));
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const draftState = useRef({ current, date, notes, quantities });
  draftState.current = { current, date, notes, quantities };

  useEffect(() => {
    if (!dirtyRef.current && current) {
      versionRef.current = current.version;
      setDate(current.date);
      setNotes(current.notes ?? '');
      setQuantities(Object.fromEntries(current.lines.map((line) => [line.id, line.orderedQuantity])));
    }
  }, [current]);

  useEffect(() => {
    if (!current || !dirtyRef.current || saveState === 'conflict') return;
    setSaveState('saving');
    saveStateRef.current = 'saving';
    saveTimer.current = window.setTimeout(() => {
      void saveDraft();
    }, 800);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
    // saveDraft reads the latest form state after the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, notes, quantities]);

  async function saveDraft(version = versionRef.current): Promise<boolean> {
    if (saveInFlight.current) {
      queuedSave.current = true;
      await savePromise.current;
      if (queuedSave.current && dirtyRef.current && saveStateRef.current !== 'conflict') {
        queuedSave.current = false;
        return saveDraft(versionRef.current);
      }
      return !dirtyRef.current;
    }
    const snapshot = draftState.current;
    const documentSnapshot = snapshot.current;
    if (!documentSnapshot) return false;
    const sequence = editSequence.current;
    const request: DocumentDraftRequest = {
      type: documentSnapshot.type as DocumentDraftRequest['type'],
      partnerId: documentSnapshot.partnerId,
      warehouseId: documentSnapshot.warehouseId,
      date: snapshot.date,
      notes: snapshot.notes,
      lines: documentSnapshot.lines.map((line) => ({
        productId: line.productId,
        unitId: line.unitId,
        quantity: snapshot.quantities[line.id] ?? line.orderedQuantity,
        ...(line.unitPrice === undefined ? {} : { unitPrice: line.unitPrice }),
      })),
    };
    saveInFlight.current = true;
    const operation = (async () => {
    try {
      const saved = await update.mutateAsync({ id: documentSnapshot.id, request: { version, draft: request } });
      versionRef.current = saved.payload.version;
      if (sequence === editSequence.current) {
        dirtyRef.current = false;
        setSaveState('saved');
        saveStateRef.current = 'saved';
      } else {
        dirtyRef.current = true;
      }
      return true;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setSaveState(status === 409 ? 'conflict' : 'error');
      saveStateRef.current = status === 409 ? 'conflict' : 'error';
      if (status === 409) queuedSave.current = false;
      if (status !== 409) toastApiError(t, error);
      return false;
    } finally {
      saveInFlight.current = false;
    }
    })();
    savePromise.current = operation;
    const saved = await operation;
    savePromise.current = null;
    if (queuedSave.current && dirtyRef.current && saveStateRef.current !== 'conflict') {
      queuedSave.current = false;
      return saveDraft(versionRef.current);
    }
    return saved && !dirtyRef.current;
  }

  async function closeEditor() {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (dirtyRef.current && !(await saveDraft())) return;
    onClose();
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
    saveStateRef.current = 'saved';
  }

  async function saveLocalAgainstLatest() {
    const latest = await detail.refetch();
    if (latest.data?.payload) {
      versionRef.current = latest.data.payload.version;
      setSaveState('saving');
      saveStateRef.current = 'saving';
      await saveDraft(latest.data.payload.version);
    }
  }

  function change<T>(setter: (value: T) => void, value: T) {
    dirtyRef.current = true;
    editSequence.current += 1;
    if (saveStateRef.current === 'saved' || saveStateRef.current === 'error') {
      saveStateRef.current = 'saving';
    }
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
    <Dialog open onOpenChange={(open) => !open && void closeEditor()}>
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
        <DialogFooter className='mt-5'><Button variant='outline' onClick={() => void closeEditor()} className='border-zinc-600 bg-zinc-800'>{t('common.done')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
