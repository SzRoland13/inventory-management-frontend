import { z } from 'zod';
import { optionalPhoneSchema } from '@/features/shared/schemas/commonSchemas';

export const companyBaseDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  email: z.string(),
  phone: optionalPhoneSchema(100),
  address: z.string(),
  website: z.string(),
});
