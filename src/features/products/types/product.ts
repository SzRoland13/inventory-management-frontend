export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ProductTableRow {
  id: number;
  sku: string;
  name: string;
  brand: string | null;
  unit: string;
  netPrice: number;
  currency: string;
  status: ProductStatus;
}
