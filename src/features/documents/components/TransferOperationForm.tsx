'use client';

import { Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DocumentAction,
  TransferResolutionOperation,
} from '@/features/documents/enums/documentEnums';
import type {
  BusinessDocument,
  DocumentOperationPreview,
} from '@/features/documents/types/documents';
import type { WarehouseResponse } from '@/features/warehouses/types/warehouse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Label } from '@/features/shared/components/ui/label';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import {
  TransferLineQuantities,
  TransferPreviewSummary,
  TransferResolutionField,
  TransferWarehouseFields,
  type TransferAction,
} from '@/features/documents/components/TransferOperationFields';

export function TransferOperationForm({
  document,
  action,
  warehouses,
  sourceId,
  destinationId,
  transitId,
  resolution,
  reason,
  effectiveAt,
  quantities,
  unitIds,
  preview,
  busy,
  selectionValid,
  lineCount,
  onSourceChange,
  onDestinationChange,
  onTransitChange,
  onResolutionChange,
  onReasonChange,
  onEffectiveAtChange,
  onQuantityChange,
  onUnitChange,
  onPreview,
  onSubmit,
  onClose,
}: {
  document: BusinessDocument;
  action: TransferAction;
  warehouses: WarehouseResponse[];
  sourceId: string;
  destinationId: string;
  transitId: string;
  resolution: TransferResolutionOperation;
  reason: string;
  effectiveAt: string;
  quantities: Record<number, string>;
  unitIds: Record<number, number | null>;
  preview: DocumentOperationPreview | null;
  busy: boolean;
  selectionValid: boolean;
  lineCount: number;
  onSourceChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onTransitChange: (value: string) => void;
  onResolutionChange: (value: TransferResolutionOperation) => void;
  onReasonChange: (value: string) => void;
  onEffectiveAtChange: (value: string) => void;
  onQuantityChange: (lineId: number, value: string) => void;
  onUnitChange: (lineId: number, unitId: number, quantity: number) => void;
  onPreview: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const isResolution = action === DocumentAction.RESOLVE_TRANSIT;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <ThemedDialogContent className='!max-w-3xl'>
        <AppDialogHeader
          title={t(`pages.documents.actions.${action}`)}
          description={t('pages.documents.operations.transferDescription', {
            number: document.number ?? t('pages.documents.draft'),
          })}
          icon={Truck}
        />
        <AppDialogBody className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='transfer-effective-at'>{t('pages.documents.operations.effectiveAt')}</Label>
            <input id='transfer-effective-at' type='datetime-local' value={effectiveAt} onChange={(event) => onEffectiveAtChange(event.target.value)} className='h-10 w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 text-sm text-zinc-100 [color-scheme:dark]' />
          </div>
          {!isResolution && (
            <TransferWarehouseFields
              warehouses={warehouses}
              sourceId={sourceId}
              destinationId={destinationId}
              transitId={transitId}
              sourceLocked={Boolean(document.sourceWarehouseId)}
              destinationLocked={Boolean(document.destinationWarehouseId)}
              onSourceChange={onSourceChange}
              onDestinationChange={onDestinationChange}
              onTransitChange={onTransitChange}
            />
          )}
          {isResolution && (
            <TransferResolutionField
              value={resolution}
              onChange={onResolutionChange}
            />
          )}
          <TransferLineQuantities
            action={action}
            lines={document.lines}
            quantities={quantities}
            unitIds={unitIds}
            onQuantityChange={onQuantityChange}
            onUnitChange={onUnitChange}
          />
          {isResolution && (
            <div className='space-y-2'>
              <Label htmlFor='transfer-reason'>
                {t('pages.documents.operations.reason')}
              </Label>
              <textarea
                id='transfer-reason'
                maxLength={500}
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                className='min-h-20 w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100'
              />
            </div>
          )}
          {preview && <TransferPreviewSummary preview={preview} />}
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant='mutedOutline'
            onClick={onClose}
            disabled={busy}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='mutedOutline'
            onClick={onPreview}
            disabled={
              busy ||
              lineCount === 0 ||
              !selectionValid ||
              (isResolution && !reason.trim())
            }
          >
            {t(
              busy
                ? 'pages.documents.operations.loading'
                : 'pages.documents.operations.preview',
            )}
          </Button>
          <Button
            variant='accentSolid'
            onClick={onSubmit}
            disabled={busy || !preview?.valid}
          >
            {t(
              busy
                ? 'pages.documents.operations.saving'
                : 'pages.documents.operations.confirm',
            )}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
