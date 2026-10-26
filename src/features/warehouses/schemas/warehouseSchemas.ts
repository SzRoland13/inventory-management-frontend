import { z } from 'zod';
import { optionalPhoneSchema } from '@/features/shared/schemas/commonSchemas';
import { isIsoCountryCode } from '@/features/shared/helpers/countries';
import {
  WarehouseType,
  type WarehouseRequest,
  type WarehouseResponse,
} from '@/features/warehouses/types/warehouse';

const required = { error: 'pages.warehouses.validation.required' };
const tooLong = { error: 'pages.warehouses.validation.too-long' };

export const warehouseFormSchema = z
  .object({
    name: z.string().trim().min(1, required).max(150, tooLong),
    code: z.string().trim().min(1, required).max(50, tooLong),
    type: z.enum(WarehouseType),
    addressEnabled: z.boolean(),
    country: z.string(),
    city: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().max(255, tooLong),
    phone: optionalPhoneSchema(50),
    email: z.string().max(255, tooLong),
  })
  .superRefine((value, context) => {
    if (!value.addressEnabled) return;
    const fields = [
      ['city', value.city, 100],
      ['addressLine1', value.addressLine1, 255],
    ] as const;
    for (const [path, text, max] of fields) {
      if (!text.trim())
        context.addIssue({
          code: 'custom',
          path: [path],
          message: required.error,
        });
      else if (text.trim().length > max)
        context.addIssue({
          code: 'custom',
          path: [path],
          message: tooLong.error,
        });
    }
    if (!isIsoCountryCode(value.country)) {
      context.addIssue({
        code: 'custom',
        path: ['country'],
        message: 'common.country.invalid',
      });
    }
  });

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export function valuesFromWarehouse(
  warehouse?: WarehouseResponse,
): WarehouseFormValues {
  return {
    name: warehouse?.name ?? '',
    code: warehouse?.code ?? '',
    type: warehouse?.type ?? WarehouseType.STANDARD,
    addressEnabled: !!warehouse?.address,
    country: warehouse?.address?.country ?? '',
    city: warehouse?.address?.city ?? '',
    addressLine1: warehouse?.address?.addressLine1 ?? '',
    addressLine2: warehouse?.address?.addressLine2 ?? '',
    phone: warehouse?.address?.phone ?? '',
    email: warehouse?.address?.email ?? '',
  };
}

export function warehouseFormToRequest(
  values: WarehouseFormValues,
): WarehouseRequest {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    type: values.type,
    address: values.addressEnabled
      ? {
          country: values.country.trim().toUpperCase(),
          city: values.city.trim(),
          addressLine1: values.addressLine1.trim(),
          addressLine2: optional(values.addressLine2),
          phone: optional(values.phone),
          email: optional(values.email),
        }
      : null,
  };
}
