import { z } from 'zod';
import {
  optionalEmailSchema,
  optionalDomesticTaxNumberSchema,
  optionalIbanSchema,
  optionalPhoneSchema,
  optionalVatSchema,
} from '@/features/shared/schemas/commonSchemas';

export const companyBaseDataSchema = z.object({
  name: z.string().max(255, { error: 'messagekey.validation.too_long' }),
  description: z.string().max(2000, { error: 'messagekey.validation.too_long' }),
  email: optionalEmailSchema(254),
  phone: optionalPhoneSchema(50),
  address: z.string().max(500, { error: 'messagekey.validation.too_long' }),
  website: z.string().regex(/^$|^https?:\/\/\S+$/, {
    error: 'messagekey.validation.website_requires_protocol',
  }).pipe(
    z.string().max(2048, { error: 'messagekey.validation.too_long' }),
  ),
});

export const companyBillingDataSchema = z.object({
  taxNumber: optionalDomesticTaxNumberSchema,
  vatNumber: optionalVatSchema,
  registrationNumber: z.string().max(100, { error: 'messagekey.validation.too_long' }),
  bankAccount: z.string().max(100, { error: 'messagekey.validation.too_long' }),
  iban: optionalIbanSchema,
});
