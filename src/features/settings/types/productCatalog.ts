import type { Brand } from '@/features/brands/types/brand';
import type {
  ProductAttributeDefinition,
  ProductCategory,
  ProductUnit,
} from '@/features/products/types/product';

export type ProductCatalogEditor =
  | { type: 'unit'; item: ProductUnit | null }
  | { type: 'brand'; item: Brand | null }
  | { type: 'category'; item: ProductCategory | null }
  | { type: 'attribute'; item: ProductAttributeDefinition | null }
  | null;
