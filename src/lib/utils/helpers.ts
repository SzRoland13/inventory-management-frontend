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

import { Routes } from './enums';

export function localizedRoute(locale: string | undefined, route: Routes) {
  const activeLocale = locale ?? 'en';
  return `/${activeLocale}${route}`;
}
