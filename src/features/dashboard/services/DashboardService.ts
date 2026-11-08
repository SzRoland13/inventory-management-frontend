import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { ProductService } from '@/features/products/services/ProductService';
import { ProductSortField, ProductStatus } from '@/features/products/types/product';
import { StockService } from '@/features/stocks/services/StockService';
import { DocumentService } from '@/features/documents/services/DocumentService';
import { DocumentQueueView } from '@/features/documents/enums/documentEnums';
import type { DashboardDateRange, DashboardSourceData } from '@/features/dashboard/types/dashboard';

export const DashboardService = {
  getSnapshot: async (range: DashboardDateRange): Promise<DashboardSourceData> => {
    const [products, balances, movements, invoices] = await Promise.all([
      requireSuccessfulResponse(
        ProductService.list({
          page: 0,
          size: 100,
          status: ProductStatus.ACTIVE,
          sortBy: ProductSortField.NAME,
          sortDirection: 'ASC',
        }),
      ),
      requireSuccessfulResponse(StockService.listBalances({ page: 0, size: 100 })),
      requireSuccessfulResponse(StockService.listMovements({
          page: 0,
          size: 100,
          startDate: range.startDate,
          endDate: range.endDate,
        })),
      requireSuccessfulResponse(DocumentService.list({
          view: DocumentQueueView.CUSTOMER_INVOICES,
          page: 0,
          pageSize: 100,
        })),
    ]);

    return {
      activeProductCount: products.payload.page.totalElements,
      products: products.payload.content,
      balances: balances.payload.content,
      movements: movements.payload.content,
      invoices: invoices.payload.items,
    };
  },
};
