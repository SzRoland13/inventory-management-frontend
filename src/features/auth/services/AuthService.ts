import { BaseService } from '@/features/shared/api/BaseService';
import {
  CheckFirstLoginResponse,
  EmailRequest,
  FirstLoginValidationRequest,
  LoginRequest,
  LoginResponse,
  PasswordSetupRequest,
  ShortLifeTokenResponse,
  TwoFactorVerifyRequest,
} from '@/features/auth/types/authDtos';
import { ApiResponse } from '@/features/shared/types/genericDtos';
import { UserDto } from '@/features/users/types/userDtos';
import { handleRequest } from '@/features/shared/api/service';

export const AuthService = {
  checkSession: async (): Promise<ApiResponse<UserDto>> => {
    return handleRequest(BaseService.get('/auth/check-session'));
  },

  checkIfFirstLogin: async (
    req: EmailRequest,
  ): Promise<ApiResponse<CheckFirstLoginResponse>> => {
    return handleRequest(BaseService.post('/auth/check-first-login', req));
  },

  requestOneTimeCode: async (req: EmailRequest): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post('/auth/send-one-time-code', req));
  },

  validateOneTimeCode: async (
    req: FirstLoginValidationRequest,
  ): Promise<ApiResponse<void>> => {
    return handleRequest(BaseService.post('/auth/validate-one-time-code', req));
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

  twoFaSetup: async (req: EmailRequest): Promise<ApiResponse<string>> => {
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
