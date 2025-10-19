import { USER_ROLE } from '@/lib/utils/enums';
import {
  Barcode,
  Home,
  Inbox,
  PackageSearch,
  Settings,
  Users,
  Clipboard,
  Warehouse,
  BadgeDollarSign,
} from 'lucide-react';

export interface SidebarItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: USER_ROLE[];
}

export const sidebarItems: SidebarItem[] = [
  {
    label: 'sidebar.dashboard',
    path: '/dashboard',
    icon: <Home className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.products',
    path: '/products',
    icon: <PackageSearch className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.warehouses',
    path: '/warehouses',
    icon: <Warehouse className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.stocks',
    path: '/stocks',
    icon: <Barcode className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.documents',
    path: '/documents',
    icon: <Inbox className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.reports',
    path: '/reports',
    icon: <Clipboard className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.sales',
    path: '/sales',
    icon: <BadgeDollarSign className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.users',
    path: '/users',
    icon: <Users className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
  {
    label: 'sidebar.settings',
    path: '/settings',
    icon: <Settings className='w-4 h-4' />,
    roles: [USER_ROLE.MANAGER, USER_ROLE.SALES, USER_ROLE.ADMIN],
  },
];
