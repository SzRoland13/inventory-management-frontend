import { Routes, UserRole } from '@/lib/utils/enums';
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
  path: Routes;
  icon?: React.ReactNode;
  roles?: UserRole[];
}

export const sidebarItems: SidebarItem[] = [
  {
    label: 'sidebar.dashboard',
    path: Routes.Dashboard,
    icon: <Home className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
  {
    label: 'sidebar.products',
    path: Routes.Products,
    icon: <PackageSearch className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
  {
    label: 'sidebar.warehouses',
    path: Routes.Warehouses,
    icon: <Warehouse className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
  {
    label: 'sidebar.stocks',
    path: Routes.Stocks,
    icon: <Barcode className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
  {
    label: 'sidebar.documents',
    path: Routes.Documents,
    icon: <Inbox className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
  {
    label: 'sidebar.reports',
    path: Routes.Reports,
    icon: <Clipboard className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    label: 'sidebar.sales',
    path: Routes.Sales,
    icon: <BadgeDollarSign className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
  {
    label: 'sidebar.users',
    path: Routes.Users,
    icon: <Users className='w-4 h-4' />,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'sidebar.settings',
    path: Routes.Settings,
    icon: <Settings className='w-4 h-4' />,
    roles: [UserRole.MANAGER, UserRole.SALES, UserRole.ADMIN],
  },
];
