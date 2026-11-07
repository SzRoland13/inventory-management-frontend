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
  const messageKey =
    error instanceof ApiResponseError ? error.messageKey : 'error.generic';

  // Keep the generic validation message resolvable after validation keys were
  // organized under the same namespace for more specific responses.
  return messageKey === 'error.validation'
    ? 'error.validation.generic'
    : messageKey;
}

export function toastApiError(
  t: ReturnType<typeof useTranslations>,
  error: unknown,
): void {
  toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
}
