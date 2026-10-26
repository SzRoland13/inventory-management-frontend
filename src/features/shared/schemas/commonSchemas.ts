import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, { error: 'common.email.required' })
  .refine(
    (email) => email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    { error: 'common.email.invalid' },
  );

export const optionalPhoneSchema = (maxLength = 50) =>
  z
    .string()
    .max(maxLength, { error: 'common.phone.too-long' })
    .refine((value) => {
      const phone = value.trim();
      if (!phone) return true;
      const digits = phone.match(/\d/g)?.length ?? 0;
      return /^\+?[0-9().\s-]+$/.test(phone) && digits >= 5 && digits <= 15;
    }, { error: 'common.phone.invalid' });
