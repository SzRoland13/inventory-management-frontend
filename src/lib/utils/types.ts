import { UserRole } from '@/lib/enums/user';

export type ModificationUser = {
  id: number | undefined;
  username: string;
  email: string;
  role: UserRole;
};
