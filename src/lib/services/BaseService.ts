import { ApiResponse } from './dtos/genericDtos';

export abstract class BaseService {
  protected async handleRequest<T>(
    promise: Promise<{ data: ApiResponse<T> }>,
  ): Promise<ApiResponse<T>> {
    try {
      const { data } = await promise;
      return data;
    } catch (error: any) {
      if (error.response?.data?.messageKey) {
        return {
          success: false,
          messageKey: error.response.data.messageKey,
          data: error.response?.data?.data ?? null,
        };
      }

      return {
        success: false,
        messageKey: 'error.unexpected',
        data: error.response?.data?.data ?? null,
      };
    }
  }
}
