import {
  AddEditUserRequest,
  UserDto,
  ModificationUser,
} from '@/lib/services/dtos/userDtos';

export const mapUserDtoToModificationUser = (
  user: UserDto,
): ModificationUser => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

export const mapModificationUserToAddEditUserRequest = (
  modificationUser: ModificationUser,
): AddEditUserRequest => {
  return {
    username: modificationUser.username,
    email: modificationUser.email,
    role: modificationUser.role,
  };
};
