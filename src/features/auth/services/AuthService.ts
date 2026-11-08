import { BaseService } from '@/features/shared/api/BaseService';
import {
  LoginRequest,
  LoginResponse,
  PasswordSetupRequest,
  ShortLifeTokenResponse,
  TwoFactorVerifyRequest,
  TwoFactorSetupRequest,
} from '@/features/auth/types/authDtos';
import { ApiResponse } from '@/features/shared/types/genericDtos';
import { UserDto } from '@/features/users/types/userDtos';
import { handleRequest } from '@/features/shared/api/service';

export const AuthService = {
  checkSession: async (): Promise<ApiResponse<UserDto>> => {
    return handleRequest(BaseService.get('/auth/check-session'));
  },

  setupNewPassword: async (
    req: PasswordSetupRequest,
  ): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post('/auth/setup-password', req));
  },

  login: async (
    req: LoginRequest,
  ): Promise<ApiResponse<ShortLifeTokenResponse>> => {
    return handleRequest(BaseService.post('/auth/login', req));
  },

  twoFaSetup: async (req: TwoFactorSetupRequest): Promise<ApiResponse<string>> => {
    return handleRequest(BaseService.post('/auth/2fa/setup', req));
  },

  twoFaLogin: async (
    req: TwoFactorVerifyRequest,
  ): Promise<ApiResponse<LoginResponse>> => {
    return handleRequest(BaseService.post('/auth/2fa/login', req));
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post('/auth/logout'));
  },
};
