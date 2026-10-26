import { z } from 'zod';
import { isIsoCountryCode } from '@/features/shared/helpers/countries';

export const isoCountryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isIsoCountryCode, { error: 'common.country.invalid' });
