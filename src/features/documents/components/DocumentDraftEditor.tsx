'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilePenLine } from 'lucide-react';
import { toast } from 'sonner';
import {
  useDocumentQuery,
  useUpdateDocumentDraftMutation,
} from '@/features/documents/queries/documentQueries';
import { useDocumentLineUnitResolver } from '@/features/documents/hooks/useDocumentLineUnitResolver';
import {
  useCurrenciesQuery,
  useExtendedCompanyQuery,
} from '@/features/settings/queries/companyQueries';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { UserRole } from '@/features/users/types/user';
import type {
  BusinessDocument,
  DocumentDraftRequest,
} from '@/features/documents/types/documents';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import {
  convertLineQuantity,
  convertLineUnitPrice,
  lineUnitName,
  lineUnitOptions,
} from '@/features/documents/utils/lineUnits';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';
import {
  DocumentDraftCurrencyFields,
  DocumentDraftDateField,
  DocumentDraftNotesField,
} from '@/features/documents/components/DocumentDraftFields';

type Props = { document: BusinessDocument | null; onClose: () => void };
type SaveState = 'saved' | 'saving' | 'error' | 'conflict';

export function DocumentDraftEditor({ document, onClose }: Props) {
  const t = useTranslations();
  const detail = useDocumentQuery(document?.id ?? null, false);
  const update = useUpdateDocumentDraftMutation({ updateDetailCache: false });
  const resolveUnitId = useDocumentLineUnitResolver();
  const company = useExtendedCompanyQuery();
  const currenciesQuery = useCurrenciesQuery();
  const session = useSessionQuery();
  const isAdmin = session.data?.payload.role === UserRole.ADMIN;
  const current = detail.data?.payload ?? document;
  const currencies = currenciesQuery.data?.payload.currencies ?? [];
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
  const [quantities, setQuantities] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      (current?.lines ?? []).map((line) => [line.id, line.orderedQuantity]),
    ),
  );
  const [unitIds, setUnitIds] = useState<Record<number, number | null>>(() =>
    Object.fromEntries((current?.lines ?? []).map((line) => [line.id, line.unitId ?? null])),
  );
  const [currencyId, setCurrencyId] = useState(
    String(current?.currencyId ?? ''),
  );
  const [exchangeRates, setExchangeRates] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        (current?.exchangeRates ?? []).map((rate) => [
          rate.sourceCurrencyId,
          String(rate.rate),
        ]),
      ),
  );
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const draftState = useRef({
    current,
    date,
    notes,
    quantities,
    unitIds,
    currencyId,
    exchangeRates,
  });
  draftState.current = {
    current,
    date,
    notes,
    quantities,
    unitIds,
    currencyId,
    exchangeRates,
  };
  const selectedCurrencyId = Number(
    currencyId ||
      current?.currencyId ||
      company.data?.payload.preferredCurrency?.id ||
      0,
  );
  const sourceCurrencyIds = [
    ...new Set(
      current?.lines
        .map((line) => line.sourceCurrencyId ?? current.currencyId)
        .filter((id): id is number => id != null) ?? [],
    ),
  ];
  const requiredSourceCurrencyIds = sourceCurrencyIds.filter(
    (id) => id !== selectedCurrencyId,
  );

  useEffect(() => {
    if (!dirtyRef.current && current) {
      versionRef.current = current.version;
      setDate(current.date);
      setNotes(current.notes ?? '');
      setQuantities(
        Object.fromEntries(
          current.lines.map((line) => [line.id, line.orderedQuantity]),
        ),
      );
      setUnitIds(Object.fromEntries(current.lines.map((line) => [line.id, line.unitId ?? null])));
      setCurrencyId(
        String(
          current.currencyId ??
            company.data?.payload.preferredCurrency?.id ??
            '',
        ),
      );
      setExchangeRates(
        Object.fromEntries(
          (current.exchangeRates ?? []).map((rate) => [
            rate.sourceCurrencyId,
            String(rate.rate),
          ]),
        ),
      );
    }
  }, [current, company.data?.payload.preferredCurrency?.id]);

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
  }, [date, notes, quantities, unitIds, currencyId, exchangeRates]);

  async function saveDraft(version = versionRef.current): Promise<boolean> {
    if (saveInFlight.current) {
      queuedSave.current = true;
      await savePromise.current;
      if (
        queuedSave.current &&
        dirtyRef.current &&
        saveStateRef.current !== 'conflict'
      ) {
        queuedSave.current = false;
        return saveDraft(versionRef.current);
      }
      return !dirtyRef.current;
    }
    const snapshot = draftState.current;
    const documentSnapshot = snapshot.current;
    if (!documentSnapshot) return false;
    const sequence = editSequence.current;
    let resolvedLines: Array<{
      line: (typeof documentSnapshot.lines)[number];
      unitId: number | null;
    }>;
    try {
      resolvedLines = await Promise.all(
        documentSnapshot.lines.map(async (line) => ({
          line,
          unitId: snapshot.unitIds[line.id] ?? await resolveUnitId(line),
        })),
      );
    } catch (error) {
      setSaveState('error');
      saveStateRef.current = 'error';
      toastApiError(t, error);
      return false;
    }
    if (resolvedLines.some(({ unitId }) => unitId === null)) {
      setSaveState('error');
      saveStateRef.current = 'error';
      toast.error(t('pages.documents.editor.unitUnavailable'));
      return false;
    }
    const targetCurrencyId = Number(
      snapshot.currencyId ||
        documentSnapshot.currencyId ||
        company.data?.payload.preferredCurrency?.id ||
        0,
    );
    if (!targetCurrencyId) {
      setSaveState('error');
      saveStateRef.current = 'error';
      toast.error(t('pages.documents.validation.currencyUnavailable'));
      return false;
    }
    const requiredRates = [
      ...new Set(
        documentSnapshot.lines
          .map(
            (line) =>
              line.sourceCurrencyId ??
              documentSnapshot.currencyId ??
              targetCurrencyId,
          )
          .filter((sourceCurrencyId) => sourceCurrencyId !== targetCurrencyId),
      ),
    ];
    const rates = requiredRates.map((sourceCurrencyId) => ({
      sourceCurrencyId,
      rate: Number(snapshot.exchangeRates[sourceCurrencyId]),
    }));
    if (rates.some(({ rate }) => !Number.isFinite(rate) || rate <= 0)) {
      setSaveState('error');
      saveStateRef.current = 'error';
      return false;
    }
    const request: DocumentDraftRequest = {
      type: documentSnapshot.type as DocumentDraftRequest['type'],
      currencyId: targetCurrencyId,
      exchangeRates: rates,
      partnerId: documentSnapshot.partnerId ?? undefined,
      warehouseId: documentSnapshot.warehouseId ?? undefined,
      date: snapshot.date,
      notes: snapshot.notes,
      lines: resolvedLines.map(({ line, unitId }) => {
        const sourceUnitPrice = line.sourceUnitPrice ?? line.unitPrice;
        return {
          productId: line.productId,
          unitId: unitId!,
          quantity: snapshot.quantities[line.id] ?? line.orderedQuantity,
          ...(sourceUnitPrice === undefined
            ? {}
            : {
                sourceUnitPrice: convertLineUnitPrice(
                  sourceUnitPrice,
                  line,
                  line.unitId,
                  unitId,
                ),
              }),
          sourceCurrencyId:
            line.sourceCurrencyId ??
            documentSnapshot.currencyId ??
            targetCurrencyId,
        };
      }),
    };
    saveInFlight.current = true;
    const focusedElement = window.document.activeElement;
    const focusedDraftElement =
      focusedElement instanceof HTMLElement &&
      focusedElement.closest('[data-draft-editor]')
        ? focusedElement
        : null;
    const selectionTarget =
      focusedDraftElement instanceof HTMLTextAreaElement ||
      (focusedDraftElement instanceof HTMLInputElement &&
        ['text', 'search', 'tel', 'url', 'password'].includes(
          focusedDraftElement.type,
        ))
        ? focusedDraftElement
        : null;
    const selection =
      selectionTarget
        ? {
            start: selectionTarget.selectionStart,
            end: selectionTarget.selectionEnd,
          }
        : null;
    const operation = (async () => {
      try {
        const saved = await update.mutateAsync({
          id: documentSnapshot.id,
          request: { version, draft: request },
        });
        const activeElement = window.document.activeElement;
        const activeDialog =
          activeElement instanceof Element
            ? activeElement.closest('[data-slot="dialog-content"]')
            : null;
        if (
          focusedDraftElement?.isConnected &&
          (activeElement === window.document.body ||
            (activeDialog && !activeDialog.hasAttribute('data-draft-editor')))
        ) {
          focusedDraftElement.focus({ preventScroll: true });
          if (
            selectionTarget &&
            selection &&
            selection.start !== null &&
            selection.end !== null
          ) {
            try {
              selectionTarget.setSelectionRange(
                selection.start,
                selection.end,
              );
            } catch {
              // Number inputs do not support selection ranges.
            }
          }
        }
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
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
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
    if (
      queuedSave.current &&
      dirtyRef.current &&
      saveStateRef.current !== 'conflict'
    ) {
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
    setQuantities(
      Object.fromEntries(
        latest.data.payload.lines.map((line) => [
          line.id,
          line.orderedQuantity,
        ]),
      ),
    );
    setCurrencyId(
      String(
        latest.data.payload.currencyId ??
          company.data?.payload.preferredCurrency?.id ??
          '',
      ),
    );
    setExchangeRates(
      Object.fromEntries(
        (latest.data.payload.exchangeRates ?? []).map((rate) => [
          rate.sourceCurrencyId,
          String(rate.rate),
        ]),
      ),
    );
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
      <ThemedDialogContent
        data-draft-editor
        className='!max-w-2xl'
      >
        <AppDialogHeader
          title={t('pages.documents.editor.title', {
            number: current.number || t('pages.documents.draft'),
          })}
          description={t('pages.documents.editor.description')}
          icon={FilePenLine}
        />
        <AppDialogBody>
          <div
            className='mb-4 flex items-center gap-2 text-sm'
            aria-live='polite'
          >
            <span
              className={`h-2 w-2 rounded-full ${saveState === 'saved' ? 'bg-emerald-400' : saveState === 'error' || saveState === 'conflict' ? 'bg-rose-400' : 'animate-pulse bg-amber-300'}`}
            />
            <span
              className={
                saveState === 'saved' ? 'text-emerald-200' : 'text-zinc-300'
              }
            >
              {statusText}
            </span>
          </div>
          {saveState === 'conflict' && (
            <div className='mb-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-sm'>
              <p className='font-medium text-amber-100'>
                {t('pages.documents.editor.conflictTitle')}
              </p>
              <p className='mt-1 text-zinc-300'>
                {t('pages.documents.editor.conflictDescription')}
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='border-zinc-600 bg-zinc-800'
                  onClick={() => void reloadServerVersion()}
                >
                  {t('pages.documents.editor.reload')}
                </Button>
                <Button size='sm' onClick={() => void saveLocalAgainstLatest()}>
                  {t('pages.documents.editor.keepMine')}
                </Button>
              </div>
            </div>
          )}
          <div className='space-y-5'>
            <DocumentDraftDateField
              value={date}
              onChange={(value) => change(setDate, value)}
            />
            <DocumentDraftCurrencyFields
              isAdmin={isAdmin}
              currencies={currencies}
              preferredCurrencyId={company.data?.payload.preferredCurrency?.id}
              currencyId={selectedCurrencyId}
              staticCurrencyCode={current.currencyCode}
              exchangeRates={exchangeRates}
              sourceCurrencyIds={requiredSourceCurrencyIds}
              onCurrencyChange={(value) => change(setCurrencyId, value)}
              onExchangeRateChange={(sourceCurrencyId, value) =>
                change(setExchangeRates, {
                  ...exchangeRates,
                  [sourceCurrencyId]: value,
                })
              }
            />
            <section className='space-y-2'>
              <h3 className='text-sm font-semibold'>
                {t('pages.documents.create.items')}
              </h3>
              {current.lines.map((line) => (
                <div
                  key={line.id}
                  className='grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>
                      {line.productName}
                    </p>
                    <p className='text-xs text-zinc-500'>{line.productCode} · {lineUnitName(line, unitIds[line.id] ?? line.unitId)}</p>
                    {lineUnitOptions(line).length > 1 && (
                      <Select value={String(unitIds[line.id] ?? line.unitId ?? line.mainUnit?.id)} onValueChange={(value) => {
                        const nextUnitId = Number(value);
                        const previousUnitId = unitIds[line.id] ?? line.unitId;
                        change(setQuantities, { ...quantities, [line.id]: convertLineQuantity(quantities[line.id] ?? line.orderedQuantity, line, previousUnitId, nextUnitId) });
                        change(setUnitIds, { ...unitIds, [line.id]: nextUnitId });
                      }}>
                        <SelectTrigger className='mt-1 h-8 w-40 border-zinc-600 bg-zinc-950 text-xs text-zinc-100'><SelectValue /></SelectTrigger>
                        <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>{lineUnitOptions(line).map((unit) => <SelectItem key={unit.id} value={String(unit.id)}>{unit.name} · {unit.symbol}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                  <Input
                    type='number'
                    min='0.001'
                    step='any'
                    aria-label={t('pages.documents.create.quantity')}
                    value={quantities[line.id] ?? line.orderedQuantity}
                    onChange={(event) =>
                      change(setQuantities, {
                        ...quantities,
                        [line.id]: Number(event.target.value),
                      })
                    }
                    className='border-zinc-600 bg-zinc-950 text-right tabular-nums'
                  />
                </div>
              ))}
            </section>
            <DocumentDraftNotesField
              value={notes}
              onChange={(value) => change(setNotes, value)}
            />
          </div>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant='outline'
            onClick={() => void closeEditor()}
            className={appDialogCancelButtonClass}
          >
            {t('common.done')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
