import { UserRole, UserStatus } from '@/lib/enums/user';

export type AddEditUserRequest = {
  username: string;
  email: string;
  role: UserRole;
};

export type UserDto = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  twoFaEnabled: boolean;
  otcSetupCompleted: boolean;
  userStatus: UserStatus;
};

export type Reset2FaRequest = {
  ids: number[];
};

export type AllUserResponse = {
  users: UserDto[];
};
