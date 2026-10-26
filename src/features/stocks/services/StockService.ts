import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  StockBalance,
  StockBalanceRequest,
  StockMovement,
  StockMovementRequest,
  StockPage,
} from '@/features/stocks/types/stock';

export const StockService = {
  listBalances: (
    params: StockBalanceRequest,
  ): Promise<ApiResponse<StockPage<StockBalance>>> =>
    handleRequest(BaseService.get('/stocks/balances', params)),
  listMovements: (
    params: StockMovementRequest,
  ): Promise<ApiResponse<StockPage<StockMovement>>> =>
    handleRequest(BaseService.get('/stocks/movements', params)),
};
