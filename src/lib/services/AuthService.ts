import { BaseService } from '@/lib/services/BaseService';
import axiosClient from '@/lib/axios/axios';
import {
  CheckFirstLoginResponse,
  EmailRequest,
  FirstLoginValidationRequest,
  LoginRequest,
  LoginResponse,
  PasswordSetupRequest,
  ShortLifeTokenResponse,
  TwoFactorVerifyRequest,
} from '@/lib/services/dtos/authDtos';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';

export class AuthService extends BaseService {
  private static _instance: AuthService | null = null;

  private constructor() {
    super();
  }

  public static instance(): AuthService {
    if (!this._instance) {
      this._instance = new AuthService();
    }
    return this._instance;
  }

  async checkIfFirstLogin(
    req: EmailRequest,
  ): Promise<ApiResponse<CheckFirstLoginResponse>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<CheckFirstLoginResponse>>(
        '/auth/check-first-login',
        req,
      ),
    );
  }

  async requestOneTimeCode(req: EmailRequest): Promise<ApiResponse<void>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<void>>('/auth/send-one-time-code', req),
    );
  }

  async validateOneTimeCode(
    req: FirstLoginValidationRequest,
  ): Promise<ApiResponse<void>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<void>>('/auth/validate-one-time-code', req),
    );
  }

  async setupNewPassword(
    req: PasswordSetupRequest,
  ): Promise<ApiResponse<void>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<void>>('/auth/setup-password', req),
    );
  }

  async login(req: LoginRequest): Promise<ApiResponse<ShortLifeTokenResponse>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<ShortLifeTokenResponse>>('/auth/login', req),
    );
  }

  async twoFaSetup(req: EmailRequest): Promise<ApiResponse<string>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<string>>('/auth/2fa/setup', req),
    );
  }

  async twoFaLogin(
    req: TwoFactorVerifyRequest,
  ): Promise<ApiResponse<LoginResponse>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<LoginResponse>>('/auth/2fa/login', req),
    );
  }
}
