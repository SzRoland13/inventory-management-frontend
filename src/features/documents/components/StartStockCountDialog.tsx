'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCreateStockCountMutation } from '@/features/documents/queries/documentQueries';
import type { BusinessDocument } from '@/features/documents/types/documents';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';

export function StartStockCountDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (document: BusinessDocument) => void;
}) {
  const t = useTranslations();
  const warehousesQuery = useWarehousesQuery();
  const createCount = useCreateStockCountMutation();
  const warehouses = (warehousesQuery.data?.payload ?? []).filter(
    (warehouse) =>
      warehouse.status === WarehouseStatus.ACTIVE &&
      warehouse.type === WarehouseType.STANDARD,
  );
  const [warehouseId, setWarehouseId] = useState('');
  const [countedAt, setCountedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );

  async function submit() {
    if (!warehouseId || createCount.isPending) return;
    try {
      const response = await createCount.mutateAsync({
        warehouseId: Number(warehouseId),
        countedAt: new Date(countedAt).toISOString(),
        lines: [],
      });
      toast.success(t('pages.documents.operations.countStarted'));
      onCreated(response.payload as BusinessDocument);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !createCount.isPending && onClose()}
    >
      <ThemedDialogContent className='!max-w-xl'>
        <AppDialogHeader
          title={t('pages.documents.operations.startCount')}
          description={t('pages.documents.operations.startCountDescription')}
          icon={ClipboardList}
        />
        <AppDialogBody className='space-y-4'>
          <div className='space-y-2'>
            <Label>{t('pages.documents.operations.warehouseId')}</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className='border-zinc-600 bg-zinc-900 text-zinc-100'>
                <SelectValue
                  placeholder={t('pages.documents.operations.selectWarehouse')}
                />
              </SelectTrigger>
              <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name} · {warehouse.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>{t('pages.documents.operations.countedAt')}</Label>
            <Input
              type='datetime-local'
              value={countedAt}
              onChange={(event) => setCountedAt(event.target.value)}
            />
          </div>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={onClose}
            disabled={createCount.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className={appDialogPrimaryButtonClass}
            onClick={() => void submit()}
            disabled={!warehouseId || createCount.isPending}
          >
            {t(
              createCount.isPending
                ? 'pages.documents.operations.saving'
                : 'pages.documents.operations.startCount',
            )}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
