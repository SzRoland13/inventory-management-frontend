'use client';

import { useState } from 'react';
import { Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCreateTransferDraftMutation } from '@/features/documents/queries/documentQueries';
import type { BusinessDocument } from '@/features/documents/types/documents';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import { useInfiniteProductsQuery } from '@/features/products/queries/productQueries';
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

type Line = { productId: number; productName: string; quantity: string; unitId: number; mainUnit: { id: number; name: string; symbol: string }; secondaryUnit: { id: number; name: string; symbol: string } | null; factor: number | null };

export function CreateTransferDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (document: BusinessDocument) => void;
}) {
  const t = useTranslations();
  const warehousesQuery = useWarehousesQuery();
  const productsQuery = useInfiniteProductsQuery('', true);
  const createTransfer = useCreateTransferDraftMutation();
  const warehouses = (warehousesQuery.data?.payload ?? []).filter(
    (warehouse) =>
      warehouse.status === WarehouseStatus.ACTIVE &&
      warehouse.type === WarehouseType.STANDARD,
  );
  const products =
    productsQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [transitWarehouseId, setTransitWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [lines, setLines] = useState<Line[]>([]);

  function addLine() {
    const product = products.find((item) => String(item.id) === productId);
    const amount = Number(quantity);
    if (!product || !Number.isFinite(amount) || amount <= 0) return;
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      const amountInExistingUnit = existing
        ? amount * (product.units.secondaryUnitsPerMainUnit ?? 1) /
          (existing.unitId === existing.mainUnit.id ? (existing.factor ?? 1) : 1)
        : amount;
      return existing
        ? current.map((line) =>
            line.productId === product.id
              ? { ...line, quantity: String(Number(line.quantity) + amountInExistingUnit) }
              : line,
          )
        : [
            ...current,
            {
              productId: product.id,
              productName: product.name,
              quantity: String(amount),
              unitId: product.units.main.id,
              mainUnit: product.units.main,
              secondaryUnit: product.units.secondary,
              factor: product.units.secondaryUnitsPerMainUnit,
            },
          ];
    });
    setProductId('');
  }

  async function submit() {
    if (
      !sourceWarehouseId ||
      !destinationWarehouseId ||
      sourceWarehouseId === destinationWarehouseId ||
      !lines.length ||
      createTransfer.isPending
    )
      return;
    try {
      const result = await createTransfer.mutateAsync({
        sourceWarehouseId: Number(sourceWarehouseId),
        destinationWarehouseId: Number(destinationWarehouseId),
        transitWarehouseId: Number(transitWarehouseId) || undefined,
        date: new Date().toISOString().slice(0, 10),
        lines: lines.map((line) => ({
          productId: line.productId,
          unitId: line.unitId,
          quantity: Number(line.quantity),
        })),
      });
      toast.success(t('pages.documents.operations.transferCreated'));
      onCreated(result.payload as BusinessDocument);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  function warehouseSelect(
    value: string,
    onChange: (next: string) => void,
    label: string,
    optional = false,
  ) {
    return (
      <div className='space-y-2'>
        <Label>{label}</Label>
        <Select
          value={value || (optional ? 'none' : '')}
          onValueChange={(next) => onChange(next === 'none' ? '' : next)}
        >
          <SelectTrigger className='border-zinc-600 bg-zinc-900 text-zinc-100'>
            <SelectValue
              placeholder={t('pages.documents.operations.selectWarehouse')}
            />
          </SelectTrigger>
          <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
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

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !createTransfer.isPending && onClose()}
    >
      <ThemedDialogContent className='!max-w-2xl'>
        <AppDialogHeader
          title={t('pages.documents.operations.createTransfer')}
          description={t(
            'pages.documents.operations.createTransferDescription',
          )}
          icon={Truck}
        />
        <AppDialogBody className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-3'>
            {warehouseSelect(
              sourceWarehouseId,
              setSourceWarehouseId,
              t('pages.documents.operations.sourceWarehouse'),
            )}
            {warehouseSelect(
              destinationWarehouseId,
              setDestinationWarehouseId,
              t('pages.documents.operations.destinationWarehouse'),
            )}
            {warehouseSelect(
              transitWarehouseId,
              setTransitWarehouseId,
              t('pages.documents.operations.transitWarehouse'),
              true,
            )}
          </div>
          <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end'>
            <div className='space-y-2'>
              <Label>{t('pages.documents.operations.product')}</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className='border-zinc-600 bg-zinc-900 text-zinc-100'>
                  <SelectValue
                    placeholder={t('pages.documents.operations.selectProduct')}
                  />
                </SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} · {product.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>{t('pages.documents.operations.quantity')}</Label>
              <Input
                type='number'
                min='0.000001'
                step='any'
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <Button
              type='button'
              variant='outline'
              onClick={addLine}
              disabled={!productId}
            >
              {t('pages.documents.operations.addLine')}
            </Button>
          </div>
          <div className='space-y-2'>
            {lines.map((line) => (
              <div
                key={line.productId}
                className='flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3'
              >
                <span className='min-w-0 flex-1 truncate text-sm'>
                  {line.productName}
                </span>
                {line.secondaryUnit && line.factor && (
                  <Select value={String(line.unitId)} onValueChange={(value) => {
                    const nextId = Number(value);
                    setLines((current) => current.map((item) => {
                      if (item.productId !== line.productId) return item;
                      const oldFactor = item.unitId === item.mainUnit.id ? item.factor ?? 1 : 1;
                      const nextFactor = nextId === item.mainUnit.id ? item.factor ?? 1 : 1;
                      return { ...item, unitId: nextId, quantity: String(Number(item.quantity) * oldFactor / nextFactor) };
                    }));
                  }}>
                    <SelectTrigger className='w-36 border-zinc-600 bg-zinc-900 text-zinc-100'><SelectValue /></SelectTrigger>
                    <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                      <SelectItem value={String(line.mainUnit.id)}>{line.mainUnit.name} · {line.mainUnit.symbol}</SelectItem>
                      <SelectItem value={String(line.secondaryUnit.id)}>{line.secondaryUnit.name} · {line.secondaryUnit.symbol}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  aria-label={line.productName}
                  type='number'
                  min='0.000001'
                  step='any'
                  className='w-28'
                  value={line.quantity}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((item) =>
                        item.productId === line.productId
                          ? { ...item, quantity: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() =>
                    setLines((current) =>
                      current.filter(
                        (item) => item.productId !== line.productId,
                      ),
                    )
                  }
                >
                  {t('pages.documents.operations.removeLine')}
                </Button>
              </div>
            ))}
          </div>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={onClose}
            disabled={createTransfer.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className={appDialogPrimaryButtonClass}
            onClick={() => void submit()}
            disabled={
              !sourceWarehouseId ||
              !destinationWarehouseId ||
              sourceWarehouseId === destinationWarehouseId ||
              !lines.length ||
              lines.some((line) => Number(line.quantity) <= 0) ||
              createTransfer.isPending
            }
          >
            {t(
              createTransfer.isPending
                ? 'pages.documents.operations.saving'
                : 'pages.documents.operations.createTransfer',
            )}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
