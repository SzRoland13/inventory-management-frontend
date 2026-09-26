import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, { error: 'common.email.required' })
  .refine(
    (email) =>
      email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    { error: 'common.email.invalid' },
  );
