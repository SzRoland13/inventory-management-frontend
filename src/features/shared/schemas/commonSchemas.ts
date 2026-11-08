import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, { error: 'common.email.required' })
  .max(254, { error: 'common.email.invalid' })
  .refine(
    (email) =>
      email.length === 0 ||
      /^(?=.{1,254}$)(?=.{1,64}@)[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,}$/i.test(
        email,
      ),
    { error: 'common.email.invalid' },
  );

export const optionalPhoneSchema = (maxLength = 50) =>
  z
    .string()
    .max(maxLength, { error: 'common.phone.too-long' })
    .refine(
      (value) => {
        if (!value.trim()) return true;
        return /^\+[1-9]\d{1,14}$/.test(value);
      },
      { error: 'common.phone.invalid' },
    );

export const optionalEmailSchema = (maxLength = 254) =>
  z.union([z.literal(''), emailSchema]).pipe(
    z.string().max(maxLength, { error: 'common.email.invalid' }),
  );

export const optionalIbanSchema = z.string().max(50, {
  error: 'messagekey.validation.too_long',
}).refine(
  (value) => {
    const iban = value.replace(/\s/g, '').toUpperCase();
    if (!iban) return true;
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = [...rearranged]
      .map((character) =>
        /[A-Z]/.test(character)
          ? String(character.charCodeAt(0) - 55)
          : character,
      )
      .join('');
    let remainder = 0;
    for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
    return remainder === 1;
  },
  { error: 'messagekey.validation.iban.invalid' },
);

export const optionalDomesticTaxNumberSchema = z
  .string()
  .max(50, { error: 'messagekey.validation.too_long' })
  .refine(
    (value) => !value.trim() || /^\d{8}-[1245]-\d{2}$/.test(value.trim()),
    { error: 'messagekey.validation.domestic_tax_number.invalid' },
  );

const euVatPatterns: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE0?\d{9}$/,
  BG: /^BG\d{9,10}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DE: /^DE\d{9}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{9}$/,
  EL: /^EL\d{9}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/,
  HR: /^HR\d{11}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d{7}[A-W][A-I]?$/,
  IT: /^IT\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/,
  LU: /^LU\d{8}$/,
  LV: /^LV\d{11}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SE: /^SE\d{12}$/,
  SI: /^SI\d{8}$/,
  SK: /^SK\d{10}$/,
};

export const euVatCountryCodes = Object.keys(euVatPatterns);

export const optionalVatSchema = z.string().max(50, {
  error: 'messagekey.validation.too_long',
}).refine(
  (value) => {
    const normalized = value.replace(/[\s.-]/g, '').toUpperCase();
    if (!normalized) return true;
    if (!/^[A-Z0-9]{1,50}$/.test(normalized)) return false;
    const country = normalized.slice(0, 2);
    const pattern = euVatPatterns[country];
    return Boolean(pattern?.test(normalized));
  },
  { error: 'messagekey.validation.vat.invalid' },
);
