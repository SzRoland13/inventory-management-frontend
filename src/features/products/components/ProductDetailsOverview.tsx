'use client';

import type { ReactNode } from 'react';
import {
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  ClipboardList,
  Ruler,
  Tags,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Currency } from '@/features/settings/types/currencyDtos';
import type {
  ProductCategory,
  ProductResponse,
} from '@/features/products/types/product';
import { Badge } from '@/features/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/features/shared/components/ui/card';

type Props = {
  product: ProductResponse;
  categories: ProductCategory[];
  currencies: Currency[];
};

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 space-y-1 ${className ?? ''}`}>
      <dt className='text-xs font-medium uppercase tracking-wide text-zinc-400'>
        {label}
      </dt>
      <dd className='break-words text-sm text-zinc-100'>
        {children ?? <span className='text-zinc-500'>—</span>}
      </dd>
    </div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`min-w-0 gap-0 border-zinc-700 bg-zinc-900 text-zinc-100 shadow-lg ${className ?? ''}`}
    >
      <CardHeader className='px-4 pb-4 sm:px-5'>
        <CardTitle className='flex items-center gap-2.5 text-base'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300'>
            <Icon className='h-4 w-4' aria-hidden='true' />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 sm:px-5'>
        <dl className='grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2'>
          {children}
        </dl>
      </CardContent>
    </Card>
  );
}

function formatAttributeValue(
  attribute: ProductResponse['attributes'][number],
  yes: string,
  no: string,
) {
  if (attribute.optionValue !== null) return attribute.optionValue;
  if (attribute.textValue !== null) return attribute.textValue;
  if (attribute.numberValue !== null) return String(attribute.numberValue);
  if (attribute.dateValue !== null) return attribute.dateValue;
  if (attribute.booleanValue !== null)
    return attribute.booleanValue ? yes : no;
  return '—';
}

export function ProductDetailsOverview({
  product,
  categories,
  currencies,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const categoriesById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const currenciesById = new Map(
    currencies.map((currency) => [currency.id, currency]),
  );
  const formatNumber = (value: number | null) =>
    value === null ? '—' : new Intl.NumberFormat(locale).format(value);
  const formatPrice = (value: number | null) => {
    if (value === null) return '—';
    const currency = product.pricing.currencyId
      ? currenciesById.get(product.pricing.currencyId)
      : undefined;
    return new Intl.NumberFormat(
      locale,
      currency ? { style: 'currency', currency: currency.code } : undefined,
    ).format(value);
  };
  const totalStock = product.stockByWarehouse.reduce(
    (total, warehouse) => total + warehouse.stockQuantity.amount,
    0,
  );
  const stockUnit =
    product.stockByWarehouse[0]?.stockQuantity.unit ?? product.units.main;
  const unitLabel = (unit: ProductResponse['units']['main'] | null) =>
    unit ? unit.symbol || unit.name : '—';
  const timestamp = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '—';

  return (
    <div className='space-y-4'>
      <Card className='gap-0 border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-100 shadow-lg'>
        <CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6'>
          <div className='min-w-0 space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge
                variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}
              >
                {t(`pages.products.status.${product.status}`)}
              </Badge>
            </div>
            <div>
              <h2 className='break-words text-2xl font-semibold tracking-tight sm:text-3xl'>
                {product.name}
              </h2>
              <p className='mt-1 break-all font-mono text-sm text-zinc-400'>
                {product.sku}
              </p>
            </div>
          </div>
          <div className='shrink-0 rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-3 sm:min-w-40'>
            <p className='text-xs font-medium uppercase tracking-wide text-zinc-400'>
              {t('pages.products.table.stock')}
            </p>
            <p className='mt-1 text-xl font-semibold text-zinc-100'>
              {new Intl.NumberFormat(locale, {
                maximumFractionDigits: 3,
              }).format(totalStock)}{' '}
              <span className='text-sm font-normal text-zinc-400'>
                {stockUnit.symbol || stockUnit.name}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className='grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2'>
        <DetailCard
          title={t('pages.products.dialog.sections.details')}
          icon={ClipboardList}
        >
          <DetailField label={t('pages.products.fields.ean')}>
            {product.ean}
          </DetailField>
          <DetailField label={t('pages.products.fields.brand')}>
            {product.brand?.name}
          </DetailField>
          <DetailField label={t('pages.products.table.categories')}>
            {product.categoryIds.length
              ? product.categoryIds
                  .map((id) => categoriesById.get(id) ?? `#${id}`)
                  .join(', ')
              : null}
          </DetailField>
          <DetailField
            label={t('pages.products.fields.description')}
            className='sm:col-span-2'
          >
            {product.description}
          </DetailField>
        </DetailCard>

        <DetailCard
          title={t('pages.products.dialog.groups.pricing')}
          icon={BadgeDollarSign}
        >
          <DetailField label={t('pages.products.fields.currency')}>
            {product.pricing.currencyId
              ? currenciesById.get(product.pricing.currencyId)?.code
              : null}
          </DetailField>
          <DetailField label={t('pages.products.fields.net-price')}>
            {formatPrice(product.pricing.netPrice)}
          </DetailField>
          <DetailField label={t('pages.products.fields.gross-price')}>
            {formatPrice(
              product.pricing.netPrice * (1 + product.pricing.vatRate / 100),
            )}
          </DetailField>
          <DetailField label={t('pages.products.fields.cost-price')}>
            {formatPrice(product.pricing.costPrice)}
          </DetailField>
          <DetailField label={t('pages.products.table.secondaryNetPrice')}>
            {formatPrice(product.pricing.secondaryNetPrice)}
          </DetailField>
          <DetailField label={t('pages.products.fields.vat-rate')}>
            {formatNumber(product.pricing.vatRate)}%
          </DetailField>
        </DetailCard>

        <DetailCard
          title={t('pages.products.dialog.groups.units')}
          icon={Boxes}
        >
          <DetailField label={t('pages.products.fields.main-unit')}>
            {unitLabel(product.units.main)}
          </DetailField>
          <DetailField label={t('pages.products.fields.secondary-unit')}>
            {unitLabel(product.units.secondary)}
          </DetailField>
          <DetailField
            label={t('pages.products.fields.secondary-units-per-main')}
          >
            {formatNumber(product.units.secondaryUnitsPerMainUnit)}
          </DetailField>
        </DetailCard>

        <DetailCard
          title={t('pages.products.dialog.sections.dimensions')}
          icon={Ruler}
        >
          {(['weight', 'width', 'height', 'depth'] as const).map((field) => (
            <DetailField
              key={field}
              label={t(`pages.products.fields.${field}`)}
            >
              {formatNumber(product.dimensions[field])}
            </DetailField>
          ))}
        </DetailCard>

        <DetailCard
          title={t('pages.products.dialog.sections.attributes')}
          icon={Tags}
        >
          {product.attributes.length ? (
            product.attributes.map((attribute) => (
              <DetailField
                key={attribute.definitionId}
                label={attribute.definitionName}
              >
                {formatAttributeValue(
                  attribute,
                  t('common.yes'),
                  t('common.no'),
                )}
              </DetailField>
            ))
          ) : (
            <DetailField label={t('pages.products.table.attributes')}>
              —
            </DetailField>
          )}
        </DetailCard>

        <DetailCard
          title={t('pages.products.details.metadata')}
          icon={CalendarClock}
        >
          <DetailField label={t('pages.products.table.createdAt')}>
            {timestamp(product.createdAt)}
          </DetailField>
          <DetailField label={t('pages.products.table.updatedAt')}>
            {timestamp(product.updatedAt)}
          </DetailField>
          {product.deletedAt && (
            <DetailField label={t('pages.products.details.archivedAt')}>
              {timestamp(product.deletedAt)}
            </DetailField>
          )}
        </DetailCard>
      </div>
    </div>
  );
}
