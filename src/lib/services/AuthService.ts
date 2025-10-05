import axiosClient from '../axios/axios';
import { BaseService } from './BaseService';
import {
  CheckFirstLoginResponse,
  EmailRequest,
  FirstLoginValidationRequest,
  LoginRequest,
  LoginResponse,
  PasswordSetupRequest,
} from './dtos/authDtos';
import { ApiResponse } from './dtos/genericDtos';

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

  async login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.handleRequest(
      axiosClient.post<ApiResponse<LoginResponse>>('/auth/login', req),
    );
  }
}
