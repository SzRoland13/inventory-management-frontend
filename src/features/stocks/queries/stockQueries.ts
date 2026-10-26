import { useQuery } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { StockService } from '@/features/stocks/services/StockService';
import type {
  StockBalanceRequest,
  StockMovementRequest,
} from '@/features/stocks/types/stock';

export function useStockBalancesQuery(
  params: StockBalanceRequest,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.stocks.balances(params),
    queryFn: () => requireSuccessfulResponse(StockService.listBalances(params)),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useStockMovementsQuery(
  params: StockMovementRequest,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.stocks.movements(params),
    queryFn: () => requireSuccessfulResponse(StockService.listMovements(params)),
    placeholderData: (previous) => previous,
    enabled,
  });
}
