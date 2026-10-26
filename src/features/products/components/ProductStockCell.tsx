'use client';

import type {
  ProductResponse,
  ProductStock,
} from '@/features/products/types/product';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/features/shared/components/ui/tooltip';
import { useLocale, useTranslations } from 'next-intl';

function formatQuantity(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(
    amount,
  );
}

function formatWarehouseQuantity(stock: ProductStock, locale: string) {
  const { fullMainUnits, secondaryUnitRemainder } = stock.displayQuantity;
  const main = `${formatQuantity(fullMainUnits.amount, locale)} ${fullMainUnits.unit.symbol}`;
  if (!secondaryUnitRemainder) return main;

  return `${main} + ${formatQuantity(secondaryUnitRemainder.amount, locale)} ${secondaryUnitRemainder.unit.symbol}`;
}

export function ProductStockCell({ product }: { product: ProductResponse }) {
  const t = useTranslations();
  const locale = useLocale();
  const total = product.stockByWarehouse.reduce(
    (quantity, stock) => quantity + stock.stockQuantity.amount,
    0,
  );
  const unit =
    product.stockByWarehouse[0]?.stockQuantity.unit ?? product.units.main;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          className='cursor-help rounded-sm text-left underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          aria-label={t('pages.products.stock.total', {
            quantity: `${formatQuantity(total, locale)} ${unit.symbol}`,
          })}
        >
          {formatQuantity(total, locale)} {unit.symbol}
        </button>
      </TooltipTrigger>
      <TooltipContent className='max-w-80 space-y-2 p-3' side='top'>
        <p className='font-semibold'>{t('pages.products.stock.by-warehouse')}</p>
        {product.stockByWarehouse.length ? (
          <ul className='space-y-1'>
            {product.stockByWarehouse.map((stock) => (
              <li
                key={stock.warehouseId}
                className='flex justify-between gap-5'
              >
                <span>{stock.warehouseName}</span>
                <span className='whitespace-nowrap'>
                  {formatWarehouseQuantity(stock, locale)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('pages.products.stock.no-warehouse-stock')}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
