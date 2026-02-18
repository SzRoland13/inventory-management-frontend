import { UserRole } from '@/lib/utils/enums';

export type ModificationUser = {
  id: number | undefined;
  username: string;
  email: string;
  role: UserRole | undefined;
};
