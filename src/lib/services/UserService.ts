import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { handleRequest } from '@/lib/utils/helpers';

export const UserService = {
  checkSession: async (): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.get('/user/check-session'));
  },
};
