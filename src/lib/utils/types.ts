import { UserRole } from '@/lib/utils/enums/user';

export type ModificationUser = {
  id: number | undefined;
  username: string;
  email: string;
  role: UserRole;
};
