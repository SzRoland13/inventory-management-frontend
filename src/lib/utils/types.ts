import { USER_ROLE, USER_STATUS } from '@/lib/utils/enums';

export type User = {
  id: number;
  username: string;
  email: string;
  role: USER_ROLE;
  is2FaEnabled: boolean;
  isOtcSetupCompleted: boolean;
  userStatus: USER_STATUS;
};
