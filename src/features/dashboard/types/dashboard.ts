import type { BusinessDocument } from '@/features/documents/types/documents';
import type { ProductResponse } from '@/features/products/types/product';
import type { StockBalance, StockMovement } from '@/features/stocks/types/stock';

export type DashboardDateRange = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
};

export type DashboardSourceData = {
  activeProductCount: number;
  products: ProductResponse[];
  balances: StockBalance[];
  movements: StockMovement[];
  invoices: BusinessDocument[];
};

export type DashboardLowStockProduct = ProductResponse & {
  quantity: number;
};

export type DashboardCurrencyTotal = {
  currency: string;
  amount: number;
};

export type DashboardViewModel = {
  activeProductCount: number;
  lowStockProducts: DashboardLowStockProduct[];
  salesDocumentCount: number;
  salesTrend: number[];
  salesTotals: DashboardCurrencyTotal[];
  movements: StockMovement[];
  inboundMovementCount: number;
  outboundMovementCount: number;
};
