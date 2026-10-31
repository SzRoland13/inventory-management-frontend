'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FilePlus2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCreateDocumentDraftMutation, useDocumentCapabilitiesQuery } from '@/features/documents/queries/documentQueries';
import { documentDraftSchema } from '@/features/documents/schemas/documentSchemas';
import { DocumentType } from '@/features/documents/enums/documentEnums';
import type { DocumentDraftRequest, ReleaseOneDocumentType } from '@/features/documents/types/documents';
import { usePartnersQuery } from '@/features/partners/queries/partnerQueries';
import { PartnerType } from '@/features/partners/types/partner';
import type { PartnerResponse } from '@/features/partners/types/partner';
import { useProductsQuery } from '@/features/products/queries/productQueries';
import { ProductSortField, ProductStatus } from '@/features/products/types/product';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import { WarehouseStatus, WarehouseType } from '@/features/warehouses/types/warehouse';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';

const availableDocumentTypes: ReleaseOneDocumentType[] = [
  DocumentType.PURCHASE_ORDER,
  DocumentType.GOODS_RECEIPT,
  DocumentType.SALES_ORDER,
  DocumentType.DELIVERY_NOTE,
];
const EMPTY_PARTNERS: PartnerResponse[] = [];
const EMPTY_DOCUMENT_TYPES: ReleaseOneDocumentType[] = [];
type DraftLine = DocumentDraftRequest['lines'][number] & { name: string; code: string; unit: string };

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function CreateDocumentDialog({ open, onOpenChange }: Props) {
  const t = useTranslations();
  const createDraft = useCreateDocumentDraftMutation();
  const capabilitiesQuery = useDocumentCapabilitiesQuery(open);
  const partnersQuery = usePartnersQuery(open);
  const warehousesQuery = useWarehousesQuery(open);
  const [type, setType] = useState<ReleaseOneDocumentType>(DocumentType.PURCHASE_ORDER);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [partnerId, setPartnerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(productSearch.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [productSearch]);

  const productsQuery = useProductsQuery({
    page: 0,
    size: 8,
    search: debouncedSearch,
    status: ProductStatus.ACTIVE,
    sortBy: ProductSortField.NAME,
    sortDirection: 'ASC',
  }, open && debouncedSearch.length >= 2);
  const partners = partnersQuery.data?.payload ?? EMPTY_PARTNERS;
  const warehouses = warehousesQuery.data?.payload ?? [];
  const creatableTypes = capabilitiesQuery.data?.payload.creatableTypes ?? EMPTY_DOCUMENT_TYPES;
  const activeType = creatableTypes.includes(type) ? type : creatableTypes[0] ?? type;
  const directFulfillment = activeType === DocumentType.GOODS_RECEIPT || activeType === DocumentType.DELIVERY_NOTE;
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === WarehouseStatus.ACTIVE && warehouse.type === WarehouseType.STANDARD);
  const eligiblePartners = useMemo(() => partners.filter((partner) => !partner.archived && (
    activeType === DocumentType.PURCHASE_ORDER || activeType === DocumentType.GOODS_RECEIPT
      ? partner.type === PartnerType.SUPPLIER || partner.type === PartnerType.BOTH
      : partner.type === PartnerType.CUSTOMER || partner.type === PartnerType.BOTH
  )), [partners, activeType]);
  const products = productsQuery.data?.payload.content ?? [];

  function addProduct(product: (typeof products)[number]) {
    if (lines.some((line) => line.productId === product.id)) return;
    setLines((current) => [...current, {
      productId: product.id,
      unitId: product.units.main.id,
      quantity: 1,
      unitPrice: product.pricing.netPrice,
      name: product.name,
      code: product.sku,
      unit: product.units.main.symbol || product.units.main.name,
    }]);
    setProductSearch('');
  }

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    const validation = documentDraftSchema.safeParse({
      type: activeType,
      date,
      partnerId: Number(partnerId),
      ...(directFulfillment ? { warehouseId: Number(warehouseId) } : {}),
      notes,
      lines: lines.map(({ productId, unitId, quantity, unitPrice }) => ({ productId, unitId, quantity, unitPrice })),
    });
    if (!validation.success) {
      setErrors(Object.fromEntries(validation.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    const request: DocumentDraftRequest = validation.data;
    try {
      await createDraft.mutateAsync(request);
      toast.success(t('pages.documents.create.created'));
      onOpenChange(false);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] max-w-2xl overflow-y-auto border-zinc-700 bg-zinc-900 text-zinc-100'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'><span className='rounded-lg bg-indigo-500/15 p-2 text-indigo-300'><FilePlus2 className='h-4 w-4' /></span>{t('pages.documents.create.title')}</DialogTitle>
          <DialogDescription className='text-zinc-400'>{t('pages.documents.create.description')}</DialogDescription>
        </DialogHeader>
        {capabilitiesQuery.isPending ? (
          <div role='status' aria-busy='true' className='space-y-4 py-2'>
            <p className='text-sm text-zinc-400'>{t('pages.documents.create.loadingOptions')}</p>
            <div className='grid grid-cols-2 gap-3'><div className='h-20 animate-pulse rounded-xl bg-zinc-800' /><div className='h-20 animate-pulse rounded-xl bg-zinc-800' /></div>
            <div className='h-10 animate-pulse rounded-md bg-zinc-800' />
            <div className='h-24 animate-pulse rounded-xl bg-zinc-800' />
          </div>
        ) : capabilitiesQuery.isError ? (
          <div className='flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4'>
            <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-300' />
            <div className='min-w-0 flex-1'><h3 className='text-sm font-semibold text-zinc-100'>{t('pages.documents.create.optionsError')}</h3><p className='mt-1 text-sm text-zinc-400'>{t('pages.documents.create.optionsErrorDescription')}</p><Button size='sm' variant='outline' onClick={() => void capabilitiesQuery.refetch()} className='mt-3 border-zinc-600 bg-zinc-800'><RefreshCw className='h-4 w-4' />{t('common.retry')}</Button></div>
          </div>
        ) : creatableTypes.length === 0 ? (
          <div className='rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-sm text-zinc-300'>{t('pages.documents.create.noTypes')}</div>
        ) : <form onSubmit={(event) => void submit(event)} className='space-y-5'>
          <div className='grid grid-cols-2 gap-3'>
            {availableDocumentTypes.filter((value) => creatableTypes.includes(value)).map((value) => <button key={value} type='button' onClick={() => { setType(value); setPartnerId(''); setWarehouseId(''); }} className={`rounded-xl border p-4 text-left transition ${activeType === value ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'}`}>
              <p className='text-sm font-medium'>{t(`pages.documents.types.${value}`)}</p><p className='mt-1 text-xs text-zinc-400'>{t(`pages.documents.create.types.${value}`)}</p>
            </button>)}
          </div>
          {directFulfillment && <div className='space-y-2'><Label>{t('pages.documents.create.warehouse')}</Label><Select value={warehouseId} onValueChange={setWarehouseId}><SelectTrigger className='border-zinc-600 bg-zinc-800 text-zinc-100'><SelectValue placeholder={t('pages.documents.create.selectWarehouse')} /></SelectTrigger><SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>{activeWarehouses.map((warehouse) => <SelectItem key={warehouse.id} value={String(warehouse.id)}>{warehouse.name} · {warehouse.code}</SelectItem>)}</SelectContent></Select>{errors.warehouseId && <p className='text-xs text-rose-300'>{t(errors.warehouseId)}</p>}</div>}

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>{t('pages.documents.create.partner')}</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger className='border-zinc-600 bg-zinc-800 text-zinc-100'><SelectValue placeholder={t('pages.documents.create.selectPartner')} /></SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>{eligiblePartners.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.partnerId && <p className='text-xs text-rose-300'>{t(errors.partnerId)}</p>}
            </div>
            <div className='space-y-2'><Label htmlFor='document-date'>{t('pages.documents.create.date')}</Label><Input id='document-date' type='date' value={date} onChange={(event) => setDate(event.target.value)} className='border-zinc-600 bg-zinc-800 text-zinc-100' />{errors.date && <p className='text-xs text-rose-300'>{t(errors.date)}</p>}</div>
          </div>

          <section className='space-y-3'>
            <div><h3 className='text-sm font-semibold'>{t('pages.documents.create.items')}</h3><p className='mt-1 text-xs text-zinc-400'>{t('pages.documents.create.itemsHint')}</p></div>
            <label className='relative block'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
              <Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t('pages.documents.create.searchProducts')} className='border-zinc-700 bg-zinc-950 pl-9 text-zinc-100' />
            </label>
            {debouncedSearch.length >= 2 && <div className='max-h-40 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800'>
              {productsQuery.isPending ? <p className='p-3 text-sm text-zinc-400'>{t('pages.documents.create.searching')}</p> : products.length ? products.map((product) => <button key={product.id} type='button' onClick={() => addProduct(product)} disabled={lines.some((line) => line.productId === product.id)} className='flex w-full items-center justify-between border-b border-zinc-700/70 px-3 py-2.5 text-left last:border-0 hover:bg-zinc-700/60 disabled:opacity-40'><span><span className='block text-sm text-zinc-100'>{product.name}</span><span className='text-xs text-zinc-400'>{product.sku}</span></span><Plus className='h-4 w-4 text-indigo-300' /></button>) : <p className='p-3 text-sm text-zinc-400'>{t('pages.documents.create.noProducts')}</p>}
            </div>}
            <div className='space-y-2'>
              {lines.map((line) => <div key={line.productId} className='grid grid-cols-[minmax(0,1fr)_90px_36px] items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3'>
                <div className='min-w-0'><p className='truncate text-sm font-medium'>{line.name}</p><p className='text-xs text-zinc-500'>{line.code} · {line.unit}</p></div>
                <Input type='number' min='0.001' step='any' value={line.quantity} onChange={(event) => setLines((current) => current.map((entry) => entry.productId === line.productId ? { ...entry, quantity: Number(event.target.value) } : entry))} aria-label={t('pages.documents.create.quantity')} className='border-zinc-600 bg-zinc-950 text-right tabular-nums' />
                <Button type='button' variant='ghost' size='icon-sm' aria-label={t('pages.documents.create.removeItem')} onClick={() => setLines((current) => current.filter((entry) => entry.productId !== line.productId))}><Trash2 className='h-4 w-4 text-zinc-400' /></Button>
              </div>)}
              {!lines.length && <div className='rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500'>{t('pages.documents.create.noItems')}</div>}
              {errors.lines && <p className='text-xs text-rose-300'>{t(errors.lines)}</p>}
            </div>
          </section>

          <div className='space-y-2'><Label htmlFor='document-notes'>{t('pages.documents.create.notes')}</Label><textarea id='document-notes' value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} maxLength={2000} placeholder={t('pages.documents.create.notesPlaceholder')} className='flex min-h-16 w-full resize-y rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-indigo-400' /></div>
          <DialogFooter className='gap-2 sm:gap-2'>
            <Button type='button' variant='outline' className='border-zinc-600 bg-zinc-800' onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type='submit' disabled={createDraft.isPending || !creatableTypes.includes(type)} className='bg-indigo-500 text-white hover:bg-indigo-400'>{createDraft.isPending ? t('pages.documents.create.saving') : t('pages.documents.create.saveDraft')}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
