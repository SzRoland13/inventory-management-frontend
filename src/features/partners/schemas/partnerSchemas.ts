import { z } from 'zod';
import {
  optionalEmailSchema,
  optionalDomesticTaxNumberSchema,
  optionalIbanSchema,
  optionalPhoneSchema,
  optionalVatSchema,
} from '@/features/shared/schemas/commonSchemas';
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
  taxNumber: optionalDomesticTaxNumberSchema,
  vatNumber: optionalVatSchema,
  registrationNumber: z.string().max(100, tooLong),
  bankAccount: z.string().max(100, tooLong),
  iban: optionalIbanSchema,
}).superRefine((values, context) => {
  if (values.type !== PartnerType.SUPPLIER && values.type !== PartnerType.BOTH) {
    return;
  }
  for (const field of ['taxNumber', 'vatNumber', 'iban', 'bankAccount'] as const) {
    if (!values[field].trim()) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: 'pages.partners.validation.required',
      });
    }
  }
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export function partnerValuesFromResponse(
  partner?: PartnerResponse,
): PartnerFormValues {
  return {
    name: partner?.name ?? '',
    type: partner?.type ?? PartnerType.CUSTOMER,
    taxNumber: partner?.taxNumber ?? '',
    vatNumber: partner?.vatNumber ?? '',
    registrationNumber: partner?.registrationNumber ?? '',
    bankAccount: partner?.bankAccount ?? '',
    iban: partner?.iban ?? '',
  };
}

export function partnerFormToRequest(
  values: PartnerFormValues,
): PartnerRequest {
  return {
    name: values.name.trim(),
    type: values.type,
    taxNumber: values.taxNumber.trim() || null,
    vatNumber: values.vatNumber.trim() || null,
    registrationNumber: values.registrationNumber.trim() || null,
    bankAccount: values.bankAccount.trim() || null,
    iban: values.iban.trim() || null,
  };
}

export const contactFormSchema = z.object({
  type: z.enum(ContactType),
  addressLine1: z.string().trim().min(1, required).max(255, tooLong),
  addressLine2: z.string().max(255, tooLong),
  city: z.string().trim().min(1, required).max(100, tooLong),
  country: isoCountryCodeSchema,
  phone: optionalPhoneSchema(50),
  email: optionalEmailSchema(254),
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
