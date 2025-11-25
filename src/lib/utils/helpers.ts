/**
 * Safely casts a string (or number) to an enum value.
 * Returns `undefined` if the value is not part of the enum.
 */
export function castToEnum<T extends Record<string, string | number>>(
  enumObj: T,
  value: string | number,
): T[keyof T] | undefined {
  const values = Object.values(enumObj) as (string | number)[];
  return values.includes(value) ? (value as T[keyof T]) : undefined;
}

import { ModificationUser, User } from '@/lib/utils/types';
import { Routes } from './enums';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';

export function localizedRoute(locale: string | undefined, route: Routes) {
  const activeLocale = locale ?? 'en';
  return `/${activeLocale}${route}`;
}

export const mapUserToModificationUser = (user: User): ModificationUser => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

export const handleRequest = async <T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<ApiResponse<T>> => {
  try {
    const { data } = await promise;

    return data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);

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
};
