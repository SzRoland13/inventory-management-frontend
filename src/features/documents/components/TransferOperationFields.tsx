'use client';

import { useTranslations } from 'next-intl';
import {
  DocumentAction,
  TransferResolutionOperation,
} from '@/features/documents/enums/documentEnums';
import type {
  DocumentLine,
  DocumentOperationPreview,
} from '@/features/documents/types/documents';
import type { WarehouseResponse } from '@/features/warehouses/types/warehouse';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';

const fieldSelectClass = 'border-zinc-600 bg-zinc-900 text-zinc-100';
const selectContentClass = 'border-zinc-700 bg-zinc-900 text-zinc-100';

export type TransferAction =
  | DocumentAction.DISPATCH
  | DocumentAction.RECEIVE_TRANSFER
  | DocumentAction.RESOLVE_TRANSIT;

type TransferWarehouseFieldsProps = {
  warehouses: WarehouseResponse[];
  sourceId: string;
  destinationId: string;
  transitId: string;
  sourceLocked: boolean;
  destinationLocked: boolean;
  onSourceChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onTransitChange: (value: string) => void;
};

export function TransferWarehouseFields({
  warehouses,
  sourceId,
  destinationId,
  transitId,
  sourceLocked,
  destinationLocked,
  onSourceChange,
  onDestinationChange,
  onTransitChange,
}: TransferWarehouseFieldsProps) {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <WarehouseSelect
        label='sourceWarehouse'
        value={sourceId}
        warehouses={warehouses}
        disabled={sourceLocked}
        onChange={onSourceChange}
      />
      <WarehouseSelect
        label='destinationWarehouse'
        value={destinationId}
        warehouses={warehouses}
        disabled={destinationLocked}
        onChange={onDestinationChange}
      />
      <WarehouseSelect
        label='transitWarehouse'
        value={transitId}
        warehouses={warehouses}
        optional
        onChange={onTransitChange}
      />
    </div>
  );
}

function WarehouseSelect({
  label,
  value,
  warehouses,
  disabled = false,
  optional = false,
  onChange,
}: {
  label: 'sourceWarehouse' | 'destinationWarehouse' | 'transitWarehouse';
  value: string;
  warehouses: WarehouseResponse[];
  disabled?: boolean;
  optional?: boolean;
  onChange: (value: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className='space-y-2'>
      <Label>{t(`pages.documents.operations.${label}`)}</Label>
      <Select
        value={value || (optional ? 'none' : '')}
        onValueChange={(next) => onChange(next === 'none' ? '' : next)}
        disabled={disabled}
      >
        <SelectTrigger className={fieldSelectClass}>
          <SelectValue
            placeholder={t('pages.documents.operations.selectWarehouse')}
          />
        </SelectTrigger>
        <SelectContent className={selectContentClass}>
          {optional && (
            <SelectItem value='none'>
              {t('pages.documents.operations.noTransit')}
            </SelectItem>
          )}
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.id} value={String(warehouse.id)}>
              {warehouse.name} · {warehouse.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TransferResolutionField({
  value,
  onChange,
}: {
  value: TransferResolutionOperation;
  onChange: (value: TransferResolutionOperation) => void;
}) {
  const t = useTranslations();

  return (
    <div className='space-y-2'>
      <Label>{t('pages.documents.operations.resolution')}</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as TransferResolutionOperation)}
      >
        <SelectTrigger className={fieldSelectClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={selectContentClass}>
          {Object.values(TransferResolutionOperation).map((operation) => (
            <SelectItem key={operation} value={operation}>
              {t(`pages.documents.operations.${operation}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TransferLineQuantities({
  action,
  lines,
  quantities,
  onQuantityChange,
}: {
  action: TransferAction;
  lines: DocumentLine[];
  quantities: Record<number, string>;
  onQuantityChange: (lineId: number, value: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className='space-y-2'>
      {lines.map((line) => (
        <div
          key={line.id}
          className='grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3'
        >
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{line.productName}</p>
            <p className='text-xs text-zinc-400'>
              {t('pages.documents.operations.transferQuantities', {
                source: line.sourceQuantity ?? line.fulfilledQuantity,
                transit: line.inTransitQuantity ?? 0,
                destination: line.destinationQuantity ?? 0,
              })}
            </p>
          </div>
          <Input
            aria-label={`${line.productName} ${t('pages.documents.operations.quantity')}`}
            type='number'
            min='0'
            max={
              action === DocumentAction.RECEIVE_TRANSFER
                ? line.inTransitQuantity
                : line.remainingQuantity
            }
            step='any'
            value={quantities[line.id] ?? '0'}
            onChange={(event) => onQuantityChange(line.id, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function TransferPreviewSummary({
  preview,
}: {
  preview: DocumentOperationPreview;
}) {
  const t = useTranslations();

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${preview.valid ? 'border-emerald-500/30 text-emerald-200' : 'border-rose-500/30 text-rose-200'}`}
    >
      <p>
        {t(
          preview.valid
            ? 'pages.documents.operations.previewValid'
            : 'pages.documents.operations.previewInvalid',
        )}
      </p>
      {preview.lines.map((line) => (
        <p key={line.sourceLineId} className='mt-2'>
          {line.productName}:{' '}
          {t('pages.documents.operations.transferEffect', {
            source: line.sourceQuantity ?? 0,
            transit: line.transitQuantity ?? 0,
            destination: line.destinationQuantity ?? 0,
            change: line.quantityDelta ?? 0,
          })}
          {line.errorMessageKey
            ? ` · ${t(`messagekey.${line.errorMessageKey}`)}`
            : ''}
        </p>
      ))}
      {preview.blockers?.map((blocker) => (
        <p key={blocker} role='alert'>
          {t(`messagekey.${blocker}`)}
        </p>
      ))}
    </div>
  );
}
