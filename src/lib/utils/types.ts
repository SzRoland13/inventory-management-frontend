import { UserRole, UserStatus } from '@/lib/utils/enums';

export type User = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  twoFaStatus: boolean;
  firstLoginStatus: boolean;
  accountStatus: UserStatus;
};

export type ModificationUser = {
  id: number | undefined;
  username: string;
  email: string;
  role: UserRole | undefined;
};
