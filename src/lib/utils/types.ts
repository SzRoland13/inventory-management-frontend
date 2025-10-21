import { USER_ROLE, ACCOUNT_STATUS } from '@/lib/utils/enums';

export type User = {
  id: number;
  username: string;
  email: string;
  role: USER_ROLE;
  twoFaStatus: boolean;
  firstLoginStatus: boolean;
  accountStatus: ACCOUNT_STATUS;
};

export type ModificationUser = {
  id: number | undefined;
  username: string;
  email: string;
  role: USER_ROLE | undefined;
};
