import { UsersTable } from '@/components/users/UsersTable';
import { USER_ROLE, USER_STATUS } from '@/lib/utils/enums';
import { User } from '@/lib/utils/types';

export default function UsersPage() {
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'admin_user',
      email: 'admin@example.com',
      role: USER_ROLE.ADMIN,
      is2FaEnabled: true,
      isOtcSetupCompleted: true,
      userStatus: USER_STATUS.ACTIVE,
    },
    {
      id: 2,
      username: 'manager_john',
      email: 'john.manager@example.com',
      role: USER_ROLE.MANAGER,
      is2FaEnabled: false,
      isOtcSetupCompleted: true,
      userStatus: USER_STATUS.ACTIVE,
    },
    {
      id: 3,
      username: 'sales_emma',
      email: 'emma.sales@example.com',
      role: USER_ROLE.SALES,
      is2FaEnabled: true,
      isOtcSetupCompleted: false,
      userStatus: USER_STATUS.SUSPENDED,
    },
    {
      id: 4,
      username: 'manager_sophia',
      email: 'sophia.manager@example.com',
      role: USER_ROLE.MANAGER,
      is2FaEnabled: false,
      isOtcSetupCompleted: false,
      userStatus: USER_STATUS.ACTIVE,
    },
    {
      id: 5,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: USER_ROLE.SALES,
      is2FaEnabled: true,
      isOtcSetupCompleted: true,
      userStatus: USER_STATUS.ACTIVE,
    },
  ];
  return (
    <div>
      <UsersTable data={mockUsers} />
    </div>
  );
}
