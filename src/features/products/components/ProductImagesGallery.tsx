'use client';

import { ImagePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProductResponse } from '@/features/products/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/shared/components/ui/card';
import { sortProductImages } from '@/features/products/helpers/productImages';
import { ProductImagePreview } from './ProductImagePreview';

export function ProductImagesGallery({ product }: { product: ProductResponse }) {
  const t = useTranslations();
  const images = sortProductImages(product.images).slice(1);

  if (images.length === 0) return null;

  return (
    <Card className='gap-0 border-zinc-700 bg-zinc-900 text-zinc-100 shadow-lg'>
      <CardHeader className='px-4 pb-4 sm:px-5'>
        <CardTitle className='flex items-center gap-2.5 text-base'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300'>
            <ImagePlus className='h-4 w-4' aria-hidden='true' />
          </span>
          {t('pages.products.images.additional')}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 pb-5 sm:px-5'>
        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
          {images.map((image) => (
            <li key={image.mediaAssetId} className='min-w-0'>
              <ProductImagePreview
                mediaAssetId={image.mediaAssetId}
                alt={`${product.name} — ${image.filename}`}
                className='w-full'
              />
              <p className='mt-2 truncate text-xs text-zinc-400' title={image.filename}>
                {image.filename}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
