import { Routes } from '@/lib/enums/routes';

export const PROTECTED_ROUTES: readonly Routes[] = [
  Routes.Dashboard,
  Routes.Products,
  Routes.Warehouses,
  Routes.Stocks,
  Routes.Documents,
  Routes.Reports,
  Routes.Sales,
  Routes.Users,
  Routes.Settings,
];

export const AUTH_ROUTES: readonly Routes[] = [
  Routes.Login,
  Routes.Login_Start,
  Routes.First_Login,
  Routes.Setup_Password,
  Routes.Two_Fa_Login,
  Routes.Two_Fa_Setup,
];

export type RouteGroup = 'protected' | 'auth' | 'public';

function matchesGroup(pathWithoutLocale: string, routes: readonly Routes[]) {
  return routes.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`),
  );
}

export function classifyPath(pathWithoutLocale: string): RouteGroup {
  if (matchesGroup(pathWithoutLocale, PROTECTED_ROUTES)) return 'protected';
  if (matchesGroup(pathWithoutLocale, AUTH_ROUTES)) return 'auth';
  return 'public';
}
