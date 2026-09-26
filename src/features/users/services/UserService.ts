import { BaseService } from '@/features/shared/api/BaseService';
import { ApiResponse } from '@/features/shared/types/genericDtos';
import {
  AddEditUserRequest,
  AllUserResponse,
  AvatarUploadRequest,
  UserDto,
} from '@/features/users/types/userDtos';
import { handleRequest } from '@/features/shared/api/service';

export const UserService = {
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
    return handleRequest(BaseService.post(`/user/suspend/${id}`));
  },

  activateUser: async (id: number): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/activate/${id}`));
  },

  resetPassword: async (id: number): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/reset-password/${id}`));
  },

  uploadUserAvatar: async (
    id: number,
    data: AvatarUploadRequest,
  ): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post(`/user/${id}/avatar`, data));
  },
};
