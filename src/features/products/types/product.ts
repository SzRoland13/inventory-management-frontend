import type { Brand } from '@/features/brands/types/brand';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  DISCONTINUED = 'DISCONTINUED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductAttributeValueType {
  FIXED = 'FIXED',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
}

export enum ProductSortField {
  SKU = 'SKU',
  NAME = 'NAME',
  BRAND = 'BRAND',
  STATUS = 'STATUS',
  NET_PRICE = 'NET_PRICE',
  VAT_RATE = 'VAT_RATE',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
}

export type ProductSortDirection = 'ASC' | 'DESC';

export type ProductListRequest = {
  page: number;
  size: number;
  search?: string;
  brand?: string;
  status?: ProductStatus;
  categoryId?: number;
  unitId?: number;
  sortBy: ProductSortField;
  sortDirection: ProductSortDirection;
};

export type ProductPage<T> = {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
};

export type ProductUnit = {
  id: number;
  code: string;
  name: string;
  symbol: string;
  system: boolean;
};

export type ProductCategory = {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number | null;
};

export type ProductCategoryRequest = {
  parentId: number | null;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type ProductAttributeOption = {
  id: number;
  value: string;
  sortOrder: number;
};

export type ProductAttributeOptionRequest = {
  value: string;
  sortOrder: number;
};

export type ProductAttributeDefinition = {
  id: number;
  code: string;
  name: string;
  valueType: ProductAttributeValueType;
  required: boolean;
  options: ProductAttributeOption[];
};

export type ProductAttributeDefinitionRequest = {
  code: string;
  name: string;
  valueType: ProductAttributeValueType;
  required: boolean;
};

export type ProductAttributeValueRequest = {
  definitionId: number;
  optionId?: number | null;
  textValue?: string | null;
  numberValue?: number | null;
  dateValue?: string | null;
  booleanValue?: boolean | null;
};

export type ProductRequest = {
  sku: string;
  ean: string | null;
  name: string;
  description: string | null;
  brandId: number | null;
  status: Exclude<ProductStatus, ProductStatus.ARCHIVED>;
  units: {
    mainUnitId: number;
    secondaryUnitId: number | null;
    secondaryUnitsPerMainUnit: number | null;
  };
  pricing: {
    currencyId: number | null;
    netPrice: number;
    costPrice: number | null;
    vatRate: number;
  };
  dimensions: {
    weight: number | null;
    width: number | null;
    height: number | null;
    depth: number | null;
  };
  categoryIds: number[];
  attributes: ProductAttributeValueRequest[];
};

export type ProductAttributeValue = {
  definitionId: number;
  definitionCode: string;
  definitionName: string;
  valueType: ProductAttributeValueType;
  optionId: number | null;
  optionValue: string | null;
  textValue: string | null;
  numberValue: number | null;
  dateValue: string | null;
  booleanValue: boolean | null;
};

export type ProductStockQuantity = {
  amount: number;
  unit: ProductUnit;
};

export type ProductStock = {
  warehouseId: number;
  warehouseName: string;
  stockQuantity: ProductStockQuantity;
  displayQuantity: {
    fullMainUnits: ProductStockQuantity;
    secondaryUnitRemainder: ProductStockQuantity | null;
  };
};

export type ProductResponse = {
  id: number;
  sku: string;
  ean: string | null;
  name: string;
  description: string | null;
  brand: Brand | null;
  status: ProductStatus;
  units: {
    main: ProductUnit;
    secondary: ProductUnit | null;
    secondaryUnitsPerMainUnit: number | null;
  };
  pricing: {
    currencyId: number | null;
    netPrice: number;
    secondaryNetPrice: number | null;
    costPrice: number | null;
    vatRate: number;
  };
  dimensions: {
    weight: number | null;
    width: number | null;
    height: number | null;
    depth: number | null;
  };
  categoryIds: number[];
  attributes: ProductAttributeValue[];
  stockByWarehouse: ProductStock[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
