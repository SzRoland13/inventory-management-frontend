import { BaseService } from '@/features/shared/api/BaseService';
import { ApiResponse } from '@/features/shared/types/genericDtos';
import { handleRequest } from '@/features/shared/api/service';
import { CurrenciesResponse } from '@/features/settings/types/currencyDtos';

export const CurrencyService = {
  getAll: async (): Promise<ApiResponse<CurrenciesResponse>> => {
    return handleRequest(BaseService.get('/currency'));
  },
};
