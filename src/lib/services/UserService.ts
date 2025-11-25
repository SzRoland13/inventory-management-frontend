import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { RegisterUserRequest, UserDto } from '@/lib/services/dtos/userDtos';
import { handleRequest } from '@/lib/utils/helpers';

export const UserService = {
  checkSession: async (): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.get('/user/check-session'));
  },

  registerUser: async (
    data: RegisterUserRequest,
  ): Promise<ApiResponse<UserDto>> => {
    return handleRequest(BaseService.post('/user/register', data));
  },
};
