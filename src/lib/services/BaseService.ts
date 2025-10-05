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
          massageKey: error.response.data.messageKey,
          data: null as any,
        };
      }

      return {
        success: false,
        massageKey: 'error.unexpected',
        data: null as any,
      };
    }
  }
}
