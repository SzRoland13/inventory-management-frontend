import { notFound } from 'next/navigation';
import { ProductDetailsScreen } from '@/features/products/screens/ProductDetailsScreen';

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId < 1) notFound();

  return <ProductDetailsScreen productId={productId} />;
}
