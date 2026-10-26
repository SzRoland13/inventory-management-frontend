import { z } from 'zod';
import { optionalPhoneSchema } from '@/features/shared/schemas/commonSchemas';
import { isoCountryCodeSchema } from '@/features/shared/schemas/countrySchemas';
import {
  ContactType,
  PartnerType,
  type ContactRequest,
  type PartnerRequest,
  type PartnerResponse,
  type ContactResponse,
} from '@/features/partners/types/partner';

const required = { error: 'pages.partners.validation.required' };
const tooLong = { error: 'pages.partners.validation.too-long' };

export const partnerFormSchema = z.object({
  name: z.string().trim().min(1, required).max(255, tooLong),
  type: z.enum(PartnerType),
  taxNumber: z.string().max(50, tooLong),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export function partnerValuesFromResponse(
  partner?: PartnerResponse,
): PartnerFormValues {
  return {
    name: partner?.name ?? '',
    type: partner?.type ?? PartnerType.CUSTOMER,
    taxNumber: partner?.taxNumber ?? '',
  };
}

export function partnerFormToRequest(
  values: PartnerFormValues,
): PartnerRequest {
  return {
    name: values.name.trim(),
    type: values.type,
    taxNumber: values.taxNumber.trim() || null,
  };
}

export const contactFormSchema = z.object({
  type: z.enum(ContactType),
  addressLine1: z.string().trim().min(1, required).max(255, tooLong),
  addressLine2: z.string().max(255, tooLong),
  city: z.string().trim().min(1, required).max(100, tooLong),
  country: isoCountryCodeSchema,
  phone: optionalPhoneSchema(50),
  email: z.union([z.literal(''), z.string().email('pages.partners.validation.email')]).pipe(z.string().max(255, tooLong)),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export function contactValuesFromResponse(
  contact?: ContactResponse,
): ContactFormValues {
  return {
    type: contact?.type ?? ContactType.BILLING,
    addressLine1: contact?.addressLine1 ?? '',
    addressLine2: contact?.addressLine2 ?? '',
    city: contact?.city ?? '',
    country: contact?.country ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
  };
}

export function contactFormToRequest(
  values: ContactFormValues,
): ContactRequest {
  const optional = (value: string) => value.trim() || null;
  return {
    type: values.type,
    addressLine1: values.addressLine1.trim(),
    addressLine2: optional(values.addressLine2),
    city: values.city.trim(),
    country: values.country.trim().toUpperCase(),
    phone: optional(values.phone),
    email: optional(values.email),
  };
}
