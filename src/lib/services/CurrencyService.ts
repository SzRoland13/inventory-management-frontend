import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { handleRequest } from '@/lib/helpers/service';
import { CurrenciesResponse } from '@/lib/services/dtos/currencyDtos';

export const CurrencyService = {
  getAll: async (): Promise<ApiResponse<CurrenciesResponse>> => {
    return handleRequest(BaseService.get('/currency'));
  },
};
