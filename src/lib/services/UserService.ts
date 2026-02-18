import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import {
  AddEditUserRequest,
  AllUserResponse,
  UserDto,
} from '@/lib/services/dtos/userDtos';
import { handleRequest } from '@/lib/utils/helpers';

export const UserService = {
  checkSession: async (): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.get('/user/check-session'));
  },

  registerUser: async (
    data: AddEditUserRequest,
  ): Promise<ApiResponse<UserDto>> => {
    return handleRequest(BaseService.post('/user/register', data));
  },

  updateUser: async (
    id: number,
    data: AddEditUserRequest,
  ): Promise<ApiResponse<UserDto>> => {
    return handleRequest(BaseService.post(`/user/${id}`, data));
  },

  getAllUsers: async (): Promise<ApiResponse<AllUserResponse>> => {
    return handleRequest(BaseService.get('/user/all'));
  },
};
