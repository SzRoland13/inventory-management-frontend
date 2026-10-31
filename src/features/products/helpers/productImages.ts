import type { ProductImageResponse } from '@/features/products/types/product';

export function sortProductImages(
  images: ProductImageResponse[] | undefined,
): ProductImageResponse[] {
  return [...(images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPrimaryProductImage(
  images: ProductImageResponse[] | undefined,
): ProductImageResponse | undefined {
  return sortProductImages(images)[0];
}
