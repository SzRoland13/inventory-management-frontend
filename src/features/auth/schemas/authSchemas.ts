import { z } from 'zod';
import { emailSchema } from '@/features/shared/schemas/commonSchemas';

export const loginStartSchema = z.object({ email: emailSchema });

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { error: 'common.password.required' })
    .min(8, { error: 'common.password.rules.min-8-chars' }),
});

export const firstLoginRequestSchema = z.object({ email: emailSchema });

export const firstLoginVerifySchema = z.object({
  email: emailSchema,
  oneTimeCode: z.string().min(1, { error: 'pages.first-login.otc.required' }),
});

const sixDigitCodeSchema = z
  .string()
  .min(1, { error: 'pages.2fa.code.required' })
  .refine((value) => value.length === 0 || /^\d{6}$/.test(value), {
    error: 'pages.2fa.code.invalid',
  });

export const twoFactorLoginSchema = z.object({
  email: emailSchema,
  code: sixDigitCodeSchema,
});

export const twoFactorSetupCodeSchema = z.object({
  code: sixDigitCodeSchema,
});

function hasSimpleSequence(value: string) {
  const normalized = value.toLowerCase();
  const sequences = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let index = 0; index < sequences.length - 3; index += 1) {
    const sequence = sequences.slice(index, index + 4);
    if (
      normalized.includes(sequence) ||
      normalized.includes([...sequence].reverse().join(''))
    ) {
      return true;
    }
  }

  return false;
}

const setupPasswordSchema = z
  .string()
  .min(1, { error: 'common.password.required' })
  .min(8, { error: 'common.password.rules.min-8-chars' })
  .refine((password) => /[A-Z]/.test(password), {
    error: 'common.password.rules.min-1-upper',
  })
  .refine((password) => /[a-z]/.test(password), {
    error: 'common.password.rules.min-1-lower',
  })
  .refine((password) => /\d/.test(password), {
    error: 'common.password.rules.min-1-number',
  })
  .refine((password) => /[^a-zA-Z0-9]/.test(password), {
    error: 'common.password.rules.min-1-special',
  })
  .refine((password) => !/(.)\1{2,}/.test(password), {
    error: 'common.password.rules.no-repeating-chars',
  })
  .refine((password) => !hasSimpleSequence(password), {
    error: 'common.password.rules.no-sequences',
  });

export const passwordSetupSchema = z
  .object({
    email: emailSchema,
    password: setupPasswordSchema,
    repeatPassword: z
      .string()
      .min(1, { error: 'pages.setup-password.repeat-password.required' }),
  })
  .refine((values) => values.password === values.repeatPassword, {
    path: ['repeatPassword'],
    error: 'pages.setup-password.repeat-password.no-match',
  });

export type LoginStartFormValues = z.infer<typeof loginStartSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type FirstLoginRequestFormValues = z.infer<
  typeof firstLoginRequestSchema
>;
export type FirstLoginVerifyFormValues = z.infer<
  typeof firstLoginVerifySchema
>;
export type TwoFactorLoginFormValues = z.infer<typeof twoFactorLoginSchema>;
export type TwoFactorSetupCodeFormValues = z.infer<
  typeof twoFactorSetupCodeSchema
>;
export type PasswordSetupFormValues = z.infer<typeof passwordSetupSchema>;
