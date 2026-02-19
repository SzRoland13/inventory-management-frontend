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
    return handleRequest(BaseService.put(`/user/${id}`, data));
  },

  getAllUsers: async (): Promise<ApiResponse<AllUserResponse>> => {
    return handleRequest(BaseService.get('/user/all'));
  },

  reset2fa: async (id: number): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/reset-2fa/${id}`));
  },

  suspendUser: async (id: number): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/reset-2fa/${id}`));
  },

  activateUser: async (id: number): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/reset-2fa/${id}`));
  },

  resetPassword: async (id: number): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/reset-2fa/${id}`));
  },
};
