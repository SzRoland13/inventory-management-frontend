import { ModificationUser } from '@/lib/utils/types';
import { Routes } from './enums';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { AddEditUserRequest, UserDto } from '@/lib/services/dtos/userDtos';

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

export const localizedRoute = (locale: string | undefined, route: Routes) => {
  const activeLocale = locale ?? 'en';
  return `/${activeLocale}${route}`;
};

export const mapUserDtoToModificationUser = (
  user: UserDto,
): ModificationUser => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

export const mapModificationUserToAddEditUserRequest = (
  modificationUser: ModificationUser,
): AddEditUserRequest => {
  return {
    username: modificationUser.username,
    email: modificationUser.email,
    role: modificationUser.role,
  };
};

export const handleRequest = async <T>(
  promise: Promise<ApiResponse<T>>,
): Promise<ApiResponse<T>> => {
  try {
    return await promise;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response?.data?.messageKey) {
      return {
        success: false,
        messageKey: error.response.data.messageKey,
        payload: error.response?.data?.payload ?? null,
      };
    }

    return {
      success: false,
      messageKey: 'error.unexpected',
      payload: error.response?.data?.payload ?? null,
    };
  }
};
