import type { ProductResponse } from '@/features/products/types/product';
import { ProductActivitySection } from '@/features/products/components/ProductActivitySection';
import { ProductStockSection } from '@/features/products/components/ProductStockSection';

export function ProductInventorySections({
  product,
}: {
  product: ProductResponse;
}) {
  return (
    <div className='space-y-4'>
      <ProductStockSection product={product} />
      <ProductActivitySection productId={product.id} />
    </div>
  );
}
