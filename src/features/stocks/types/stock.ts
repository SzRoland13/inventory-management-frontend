export type StockPage<T> = {
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

export type StockUnit = {
  id: number;
  code: string;
  name: string;
  symbol: string;
  system: boolean;
};

export type StockBalanceRequest = {
  page: number;
  size: number;
  search?: string;
  productId?: number;
  warehouseId?: number;
};

export type StockMovementRequest = {
  page: number;
  size: number;
  productId?: number;
  warehouseId?: number;
  startDate?: string;
  endDate?: string;
};

export type StockBalance = {
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  mainUnit: StockUnit;
  secondaryQuantity: number | null;
  secondaryUnit: StockUnit | null;
  secondaryUnitsPerMainUnit: number | null;
};

export type StockMovementType =
  | 'PURCHASE_INBOUND'
  | 'SALE_OUTBOUND'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_INCREASE'
  | 'ADJUSTMENT_DECREASE'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | (string & {});

export type StockMovement = {
  id: number;
  date: string;
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantityChange: number;
  unit: StockUnit;
  secondaryQuantityChange: number | null;
  secondaryUnit: StockUnit | null;
  movementType: StockMovementType;
  documentId: number | null;
  documentNumber: string | null;
  documentLineId: number | null;
};
