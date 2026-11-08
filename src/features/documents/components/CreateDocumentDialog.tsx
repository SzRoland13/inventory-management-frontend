'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronsUpDown,
  FilePlus2,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  useCreateDocumentDraftMutation,
  useDocumentCapabilitiesQuery,
} from '@/features/documents/queries/documentQueries';
import { documentDraftSchema } from '@/features/documents/schemas/documentSchemas';
import { DocumentType } from '@/features/documents/enums/documentEnums';
import type {
  DocumentDraftRequest,
  DraftDocumentType,
} from '@/features/documents/types/documents';
import { usePartnersQuery } from '@/features/partners/queries/partnerQueries';
import { PartnerType } from '@/features/partners/types/partner';
import type { PartnerResponse } from '@/features/partners/types/partner';
import { useInfiniteProductsQuery } from '@/features/products/queries/productQueries';
import type { ProductUnit } from '@/features/products/types/product';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import {
  useCurrenciesQuery,
  useExtendedCompanyQuery,
} from '@/features/settings/queries/companyQueries';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { UserRole } from '@/features/users/types/user';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import { toastApiError } from '@/features/shared/api/apiResponse';
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
import { ScrollArea } from '@/features/shared/components/ui/scroll-area';
import { formatDocumentAmount } from '@/features/documents/helpers/documentPresentation';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import {
  DocumentDraftCurrencyFields,
  DocumentDraftDateField,
  DocumentDraftNotesField,
} from '@/features/documents/components/DocumentDraftFields';

const availableDocumentTypes: DraftDocumentType[] = [
  DocumentType.PURCHASE_ORDER,
  DocumentType.GOODS_RECEIPT,
  DocumentType.SALES_ORDER,
  DocumentType.DELIVERY_NOTE,
];
const EMPTY_PARTNERS: PartnerResponse[] = [];
const EMPTY_DOCUMENT_TYPES: DraftDocumentType[] = [];
type DraftLine = Omit<
  DocumentDraftRequest['lines'][number],
  'sourceUnitPrice'
> & {
  sourceUnitPrice: number;
  sourceCurrencyId: number;
  name: string;
  code: string;
  unit: string;
  mainUnit: ProductUnit;
  secondaryUnit: ProductUnit | null;
  secondaryUnitsPerMainUnit: number | null;
  mainUnitPrice: number;
  secondaryUnitPrice: number | null;
};

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function CreateDocumentDialog({ open, onOpenChange }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const createDraft = useCreateDocumentDraftMutation();
  const capabilitiesQuery = useDocumentCapabilitiesQuery(open);
  const partnersQuery = usePartnersQuery(open);
  const warehousesQuery = useWarehousesQuery(open);
  const currenciesQuery = useCurrenciesQuery(open);
  const companyQuery = useExtendedCompanyQuery(open);
  const sessionQuery = useSessionQuery();
  const isAdmin = sessionQuery.data?.payload.role === UserRole.ADMIN;
  const currencies = currenciesQuery.data?.payload.currencies ?? [];
  const preferredCurrencyId = companyQuery.data?.payload.preferredCurrency?.id;
  const [type, setType] = useState<DraftDocumentType>(
    DocumentType.PURCHASE_ORDER,
  );
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [partnerId, setPartnerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<number, string>>(
    {},
  );
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const productListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedProductSearch(productSearch.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [productSearch]);

  const productsQuery = useInfiniteProductsQuery(
    debouncedProductSearch,
    open && productPickerOpen,
  );
  const partners = partnersQuery.data?.payload ?? EMPTY_PARTNERS;
  const warehouses = warehousesQuery.data?.payload ?? [];
  const creatableTypes =
    capabilitiesQuery.data?.payload.creatableTypes ?? EMPTY_DOCUMENT_TYPES;
  const activeType = creatableTypes.includes(type)
    ? type
    : (creatableTypes[0] ?? type);
  const directFulfillment =
    activeType === DocumentType.GOODS_RECEIPT ||
    activeType === DocumentType.DELIVERY_NOTE;
  const activeWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.status === WarehouseStatus.ACTIVE &&
      warehouse.type === WarehouseType.STANDARD,
  );
  const eligiblePartners = useMemo(
    () =>
      partners.filter(
        (partner) =>
          !partner.archived &&
          (activeType === DocumentType.PURCHASE_ORDER ||
          activeType === DocumentType.GOODS_RECEIPT
            ? partner.type === PartnerType.SUPPLIER ||
              partner.type === PartnerType.BOTH
            : partner.type === PartnerType.CUSTOMER ||
              partner.type === PartnerType.BOTH),
      ),
    [partners, activeType],
  );
  const products =
    productsQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const selectedCurrencyId = Number(currencyId || preferredCurrencyId || '');
  const currencyById = new Map(
    currencies.map((currency) => [currency.id, currency]),
  );
  const requiredSourceCurrencyIds = [
    ...new Set(lines.map((line) => line.sourceCurrencyId)),
  ].filter((sourceCurrencyId) => sourceCurrencyId !== selectedCurrencyId);

  function addProduct(product: (typeof products)[number]) {
    if (
      !selectedCurrencyId ||
      lines.some((line) => line.productId === product.id)
    )
      return;
    const sourceCurrencyId =
      product.pricing.currencyId ?? preferredCurrencyId ?? selectedCurrencyId;
    setLines((current) => [
      ...current,
      {
        productId: product.id,
        unitId: product.units.main.id,
        quantity: 1,
        sourceUnitPrice: product.pricing.netPrice,
        mainUnit: product.units.main,
        secondaryUnit: product.units.secondary,
        secondaryUnitsPerMainUnit: product.units.secondaryUnitsPerMainUnit,
        mainUnitPrice: product.pricing.netPrice,
        secondaryUnitPrice: product.pricing.secondaryNetPrice,
        sourceCurrencyId,
        name: product.name,
        code: product.sku,
        unit: product.units.main.symbol || product.units.main.name,
      },
    ]);
    setProductPickerOpen(false);
    setProductSearch('');
    setDebouncedProductSearch('');
  }

  function loadMoreProducts() {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }

  function handleProductListScroll() {
    const list = productListRef.current;
    if (!list) return;
    if (list.scrollHeight - list.scrollTop - list.clientHeight < 48) {
      loadMoreProducts();
    }
  }

  function resetForm() {
    setType(DocumentType.PURCHASE_ORDER);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPartnerId('');
    setWarehouseId('');
    setCurrencyId('');
    setExchangeRates({});
    setNotes('');
    setPaymentTerms('');
    setProductPickerOpen(false);
    setProductSearch('');
    setDebouncedProductSearch('');
    setLines([]);
    setErrors({});
  }

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    const validation = documentDraftSchema.safeParse({
      type: activeType,
      currencyId: selectedCurrencyId,
      exchangeRates: requiredSourceCurrencyIds.map((sourceCurrencyId) => ({
        sourceCurrencyId,
        rate: Number(exchangeRates[sourceCurrencyId]),
      })),
      date,
      partnerId: Number(partnerId),
      ...(directFulfillment ? { warehouseId: Number(warehouseId) } : {}),
      notes,
      paymentTerms,
      lines: lines.map(
        ({
          productId,
          unitId,
          quantity,
          sourceUnitPrice,
          sourceCurrencyId,
        }) => ({
          productId,
          unitId,
          quantity,
          sourceUnitPrice,
          sourceCurrencyId,
        }),
      ),
    });
    if (!validation.success) {
      setErrors(
        Object.fromEntries(
          validation.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setErrors({});
    const request: DocumentDraftRequest = validation.data;
    try {
      await createDraft.mutateAsync(request);
      toast.success(t('pages.documents.create.created'));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent className='!h-[min(92vh,48rem)] !max-h-[92vh] !max-w-2xl'>
        <AppDialogHeader
          title={t('pages.documents.create.title')}
          description={t('pages.documents.create.description')}
          icon={FilePlus2}
        />
        {capabilitiesQuery.isPending ? (
          <AppDialogBody>
            <div role='status' aria-busy='true' className='space-y-4 py-2'>
              <p className='text-sm text-zinc-400'>
                {t('pages.documents.create.loadingOptions')}
              </p>
              <div className='grid grid-cols-2 gap-3'>
                <div className='h-20 animate-pulse rounded-xl bg-zinc-800' />
                <div className='h-20 animate-pulse rounded-xl bg-zinc-800' />
              </div>
              <div className='h-10 animate-pulse rounded-md bg-zinc-800' />
              <div className='h-24 animate-pulse rounded-xl bg-zinc-800' />
            </div>
          </AppDialogBody>
        ) : capabilitiesQuery.isError ? (
          <AppDialogBody>
            <div className='flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4'>
              <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-300' />
              <div className='min-w-0 flex-1'>
                <h3 className='text-sm font-semibold text-zinc-100'>
                  {t('pages.documents.create.optionsError')}
                </h3>
                <p className='mt-1 text-sm text-zinc-400'>
                  {t('pages.documents.create.optionsErrorDescription')}
                </p>
                <Button
                  size='sm'
                  onClick={() => void capabilitiesQuery.refetch()}
                  variant='subtleOutline' className='mt-3'
                >
                  <RefreshCw className='h-4 w-4' />
                  {t('common.retry')}
                </Button>
              </div>
            </div>
          </AppDialogBody>
        ) : creatableTypes.length === 0 ? (
          <AppDialogBody>
            <div className='rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-sm text-zinc-300'>
              {t('pages.documents.create.noTypes')}
            </div>
          </AppDialogBody>
        ) : (
          <form
            onSubmit={(event) => void submit(event)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <AppDialogBody className='!overflow-hidden !p-0'>
              <ScrollArea className='h-full min-h-0'>
                <div className='space-y-5 px-2 pb-5 pr-6'>
                  <div className='grid grid-cols-2 gap-3'>
                    {availableDocumentTypes
                      .filter((value) => creatableTypes.includes(value))
                      .map((value) => (
                        <button
                          key={value}
                          type='button'
                          onClick={() => {
                            setType(value);
                            setPartnerId('');
                            setWarehouseId('');
                          }}
                          className={`rounded-xl border p-4 text-left transition ${activeType === value ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'}`}
                        >
                          <p className='text-sm font-medium'>
                            {t(`pages.documents.types.${value}`)}
                          </p>
                          <p className='mt-1 text-xs text-zinc-400'>
                            {t(`pages.documents.create.types.${value}`)}
                          </p>
                        </button>
                      ))}
                  </div>
                  {directFulfillment && (
                    <div className='space-y-2'>
                      <Label>{t('pages.documents.create.warehouse')}</Label>
                      <Select
                        value={warehouseId}
                        onValueChange={setWarehouseId}
                      >
                        <SelectTrigger className='w-full border-zinc-600 bg-zinc-800 text-zinc-100'>
                          <SelectValue
                            placeholder={t(
                              'pages.documents.create.selectWarehouse',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent
                          position='popper'
                          side='bottom'
                          sideOffset={4}
                          avoidCollisions={false}
                          className='border-zinc-700 bg-zinc-800 text-zinc-100'
                        >
                          {activeWarehouses.map((warehouse) => (
                            <SelectItem
                              key={warehouse.id}
                              value={String(warehouse.id)}
                            >
                              {warehouse.name} · {warehouse.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.warehouseId && (
                        <p className='text-xs text-rose-300'>
                          {t(errors.warehouseId)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className='grid grid-cols-1 gap-4'>
                    <div className='space-y-2'>
                      <Label>{t('pages.documents.create.partner')}</Label>
                      <Select value={partnerId} onValueChange={setPartnerId}>
                        <SelectTrigger className='w-full border-zinc-600 bg-zinc-800 text-zinc-100'>
                          <SelectValue
                            placeholder={t(
                              'pages.documents.create.selectPartner',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent
                          position='popper'
                          side='bottom'
                          sideOffset={4}
                          avoidCollisions={false}
                          className='border-zinc-700 bg-zinc-800 text-zinc-100'
                        >
                          {eligiblePartners.map((partner) => (
                            <SelectItem
                              key={partner.id}
                              value={String(partner.id)}
                            >
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.partnerId && (
                        <p className='text-xs text-rose-300'>
                          {t(errors.partnerId)}
                        </p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <DocumentDraftDateField value={date} onChange={setDate} />
                      {errors.date && (
                        <p className='text-xs text-rose-300'>
                          {t(errors.date)}
                        </p>
                      )}
                    </div>
                  </div>

                  <DocumentDraftCurrencyFields
                    isAdmin={isAdmin}
                    currencies={currencies}
                    preferredCurrencyId={preferredCurrencyId}
                    currencyId={selectedCurrencyId}
                    staticCurrencyCode={
                      currencyById.get(selectedCurrencyId)?.code
                    }
                    exchangeRates={exchangeRates}
                    sourceCurrencyIds={requiredSourceCurrencyIds}
                    onCurrencyChange={setCurrencyId}
                    onExchangeRateChange={(sourceCurrencyId, value) =>
                      setExchangeRates((current) => ({
                        ...current,
                        [sourceCurrencyId]: value,
                      }))
                    }
                    currencyError={errors.currencyId}
                    exchangeRateError={!!errors.exchangeRates}
                  />

                  <section className='space-y-3'>
                    <div>
                      <h3 className='text-sm font-semibold'>
                        {t('pages.documents.create.items')}
                      </h3>
                      <p className='mt-1 text-xs text-zinc-400'>
                        {t('pages.documents.create.itemsHint')}
                      </p>
                    </div>
                    <PopoverPrimitive.Root
                      open={productPickerOpen}
                      onOpenChange={(nextOpen) => {
                        setProductPickerOpen(nextOpen);
                        if (!nextOpen) {
                          setProductSearch('');
                          setDebouncedProductSearch('');
                        }
                      }}
                    >
                      <PopoverPrimitive.Trigger asChild>
                        <Button
                          type='button'
                          role='combobox'
                          aria-haspopup='listbox'
                          aria-expanded={productPickerOpen}
                          className='w-full justify-between border border-zinc-700 bg-zinc-950 text-left font-normal text-zinc-400 hover:bg-zinc-900'
                        >
                          {t('pages.documents.create.selectProduct')}
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </PopoverPrimitive.Trigger>
                      <PopoverPrimitive.Portal>
                        <PopoverPrimitive.Content
                          side='bottom'
                          align='start'
                          sideOffset={4}
                          avoidCollisions={false}
                          className='z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-0 shadow-xl outline-none'
                        >
                          <div className='relative border-b border-zinc-700'>
                            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
                            <Input
                              autoFocus
                              value={productSearch}
                              onChange={(event) =>
                                setProductSearch(event.target.value)
                              }
                              placeholder={t(
                                'pages.documents.create.searchProducts',
                              )}
                              className='h-10 rounded-none border-0 bg-transparent pl-9 text-zinc-100 focus-visible:ring-0'
                            />
                          </div>
                          <div
                            ref={productListRef}
                            role='listbox'
                            aria-label={t(
                              'pages.documents.create.selectProduct',
                            )}
                            onScroll={handleProductListScroll}
                            className='max-h-64 overflow-y-auto p-1'
                          >
                            {products.map((product) => {
                              const alreadyAdded = lines.some(
                                (line) => line.productId === product.id,
                              );
                              return (
                                <button
                                  key={product.id}
                                  type='button'
                                  role='option'
                                  aria-selected={alreadyAdded}
                                  disabled={alreadyAdded || !selectedCurrencyId}
                                  onClick={() => addProduct(product)}
                                  className='flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm text-zinc-100 outline-none hover:bg-zinc-800 focus:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40'
                                >
                                  <span className='min-w-0'>
                                    <span className='block truncate'>
                                      {product.name}
                                    </span>
                                    <span className='block truncate text-xs text-zinc-400'>
                                      {product.sku}
                                    </span>
                                  </span>
                                  {alreadyAdded && (
                                    <span className='ml-3 text-xs text-zinc-500'>
                                      {t('pages.documents.create.added')}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                            {productsQuery.isPending && (
                              <p
                                role='status'
                                className='px-3 py-4 text-center text-sm text-zinc-400'
                              >
                                {t('pages.documents.create.loadingProducts')}
                              </p>
                            )}
                            {!productsQuery.isPending &&
                              !productsQuery.isError &&
                              products.length === 0 && (
                                <p className='px-3 py-4 text-center text-sm text-zinc-400'>
                                  {t('pages.documents.create.noProducts')}
                                </p>
                              )}
                            {productsQuery.isError && (
                              <div className='flex items-center justify-between gap-3 px-3 py-3 text-xs text-rose-300'>
                                <span>
                                  {t(
                                    'pages.documents.create.productOptionsError',
                                  )}
                                </span>
                                <Button
                                  type='button'
                                  size='sm'
                                  onClick={() => void productsQuery.refetch()}
                                  variant='subtleOutline'
                                >
                                  {t('common.retry')}
                                </Button>
                              </div>
                            )}
                            {productsQuery.hasNextPage && (
                              <Button
                                type='button'
                                variant='ghost'
                                onClick={loadMoreProducts}
                                disabled={productsQuery.isFetchingNextPage}
                                className='w-full text-xs text-zinc-300'
                              >
                                {t(
                                  productsQuery.isFetchingNextPage
                                    ? 'pages.documents.create.loadingMoreProducts'
                                    : 'pages.documents.create.loadMoreProducts',
                                )}
                              </Button>
                            )}
                          </div>
                        </PopoverPrimitive.Content>
                      </PopoverPrimitive.Portal>
                    </PopoverPrimitive.Root>
                    <div className='space-y-2'>
                      {lines.map((line) => {
                        const sourceCurrencyCode =
                          currencyById.get(line.sourceCurrencyId)?.code ?? null;
                        const rate =
                          line.sourceCurrencyId === selectedCurrencyId
                            ? 1
                            : Number(exchangeRates[line.sourceCurrencyId]);
                        const convertedPrice =
                          Number.isFinite(rate) && rate > 0
                            ? line.sourceUnitPrice * rate
                            : null;
                        return (
                          <div
                            key={line.productId}
                            className='grid grid-cols-[minmax(0,1fr)_90px_36px] items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3'
                          >
                            <div className='min-w-0'>
                              <p className='truncate text-sm font-medium'>
                                {line.name}
                              </p>
                              <p className='text-xs text-zinc-500'>{line.code}</p>
                              {line.secondaryUnit && line.secondaryUnitsPerMainUnit && (
                                <Select value={String(line.unitId)} onValueChange={(value) => {
                                  const nextId = Number(value);
                                  setLines((current) => current.map((entry) => {
                                    if (entry.productId !== line.productId) return entry;
                                    const previousFactor = entry.unitId === entry.mainUnit.id ? entry.secondaryUnitsPerMainUnit ?? 1 : 1;
                                    const nextFactor = nextId === entry.mainUnit.id ? entry.secondaryUnitsPerMainUnit ?? 1 : 1;
                                    const nextUnit = nextId === entry.mainUnit.id ? entry.mainUnit : entry.secondaryUnit!;
                                    return {
                                      ...entry,
                                      unitId: nextId,
                                      unit: nextUnit.symbol || nextUnit.name,
                                      quantity: entry.quantity * previousFactor / nextFactor,
                                      sourceUnitPrice: nextId === entry.mainUnit.id
                                        ? entry.mainUnitPrice
                                        : entry.secondaryUnitPrice ?? entry.mainUnitPrice / (entry.secondaryUnitsPerMainUnit ?? 1),
                                    };
                                  }));
                                }}>
                                  <SelectTrigger className='mt-1 h-8 w-40 border-zinc-600 bg-zinc-950 text-xs text-zinc-100'><SelectValue /></SelectTrigger>
                                  <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                                    <SelectItem value={String(line.mainUnit.id)}>{line.mainUnit.name} · {line.mainUnit.symbol}</SelectItem>
                                    <SelectItem value={String(line.secondaryUnit.id)}>{line.secondaryUnit.name} · {line.secondaryUnit.symbol}</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              <p className='mt-1 truncate text-xs tabular-nums text-zinc-400'>
                                {formatDocumentAmount(
                                  line.sourceUnitPrice,
                                  sourceCurrencyCode,
                                  locale,
                                )}
                                {convertedPrice === null
                                  ? ''
                                  : ` → ${formatDocumentAmount(convertedPrice, currencyById.get(selectedCurrencyId)?.code, locale)}`}
                              </p>
                            </div>
                            <Input
                              type='number'
                              min='0.001'
                              step='any'
                              value={line.quantity}
                              onChange={(event) =>
                                setLines((current) =>
                                  current.map((entry) =>
                                    entry.productId === line.productId
                                      ? {
                                          ...entry,
                                          quantity: Number(event.target.value),
                                        }
                                      : entry,
                                  ),
                                )
                              }
                              aria-label={t('pages.documents.create.quantity')}
                              className='border-zinc-600 bg-zinc-950 text-right tabular-nums'
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon-sm'
                              aria-label={t(
                                'pages.documents.create.removeItem',
                              )}
                              onClick={() =>
                                setLines((current) =>
                                  current.filter(
                                    (entry) =>
                                      entry.productId !== line.productId,
                                  ),
                                )
                              }
                            >
                              <Trash2 className='h-4 w-4 text-zinc-400' />
                            </Button>
                          </div>
                        );
                      })}
                      {!lines.length && (
                        <div className='rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500'>
                          {t('pages.documents.create.noItems')}
                        </div>
                      )}
                      {errors.lines && (
                        <p className='text-xs text-rose-300'>
                          {t(errors.lines)}
                        </p>
                      )}
                    </div>
                  </section>

                  <DocumentDraftNotesField value={notes} onChange={setNotes} />
                  <div className='space-y-2'>
                    <Label htmlFor='payment-terms'>{t('pages.documents.commercial.paymentTerms')}</Label>
                    <textarea id='payment-terms' value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={2} maxLength={500} className='flex min-h-16 max-h-[40vh] w-full resize-y rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:border-indigo-400 focus-visible:ring-0' />
                  </div>
                </div>
              </ScrollArea>
            </AppDialogBody>
            <AppDialogFooter className='gap-2 sm:gap-2'>
              <Button
                type='button'
                variant='subtleOutline'
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type='submit'
                disabled={
                  createDraft.isPending ||
                  !creatableTypes.includes(type) ||
                  !selectedCurrencyId
                }
                variant='accentSolid'
              >
                {createDraft.isPending
                  ? t('pages.documents.create.saving')
                  : t('pages.documents.create.saveDraft')}
              </Button>
            </AppDialogFooter>
          </form>
        )}
      </ThemedDialogContent>
    </Dialog>
  );
}
