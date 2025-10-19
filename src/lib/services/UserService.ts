import axiosClient from '@/lib/axios/axios';
import { BaseService } from '@/lib/services/BaseService';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';

export class UserService extends BaseService {
  private static _instance: UserService | null = null;

  private constructor() {
    super();
  }

  public static instance(): UserService {
    if (!this._instance) {
      this._instance = new UserService();
    }
    return this._instance;
  }

  async checkSession(): Promise<ApiResponse<void>> {
    return this.handleRequest(
      axiosClient.get<ApiResponse<void>>('/user/check-session'),
    );
  }
}
