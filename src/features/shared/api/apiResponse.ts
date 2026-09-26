import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiResponse } from '@/features/shared/types/genericDtos';

export class ApiResponseError extends Error {
  constructor(public readonly messageKey: string) {
    super(messageKey);
    this.name = 'ApiResponseError';
  }
}

export async function requireSuccessfulResponse<T>(
  request: Promise<ApiResponse<T>>,
): Promise<ApiResponse<T>> {
  const response = await request;

  if (!response.success) {
    throw new ApiResponseError(response.messageKey);
  }

  return response;
}

export function getApiErrorMessageKey(error: unknown): string {
  return error instanceof ApiResponseError
    ? error.messageKey
    : 'error.generic';
}

export function toastApiError(
  t: ReturnType<typeof useTranslations>,
  error: unknown,
): void {
  toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
}
