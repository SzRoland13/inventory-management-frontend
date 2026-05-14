import { ApiResponse } from '@/lib/services/dtos/genericDtos';

export const handleRequest = async <T>(
  promise: Promise<ApiResponse<T>>,
): Promise<ApiResponse<T>> => {
  try {
    return await promise;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error && error.response?.data?.messageKey) {
      return {
        success: false,
        messageKey: error.response.data.messageKey,
        payload: error.response?.data?.payload ?? null,
      };
    } else {
      return {
        success: false,
        messageKey: 'error.unexpected',
        payload: error.response?.data?.payload ?? null,
      };
    }
  }
};
