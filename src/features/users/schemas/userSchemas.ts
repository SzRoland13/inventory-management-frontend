import { z } from 'zod';
import { UserRole } from '@/features/users/types/user';
import { emailSchema } from '@/features/shared/schemas/commonSchemas';

export const addEditUserSchema = z.object({
  id: z.union([z.number(), z.undefined()]),
  username: z.string().min(1, { error: 'common.username.required' }),
  email: emailSchema,
  role: z.enum(UserRole, { error: 'common.role.required' }),
});

export type AddEditUserFormValues = z.infer<typeof addEditUserSchema>;
